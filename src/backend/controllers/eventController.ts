// src/backend/controllers/eventController.ts
import { Response } from "express";
import mongoose from "mongoose";

import Event, { IEvent } from "../models/event";
import { AuthRequest } from "../types/indexexpress";
import { uploadFile as uploadToCloudinary, deleteByPublicId } from "../services/cloudinaryService";

type SupportedMediaType = "image" | "video";

type MediaRecord = {
  url: string;
  public_id?: string | null;
  type: SupportedMediaType;
};

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
]);

const MAX_IMAGE_SIZE_BYTES = 6 * 1024 * 1024; // 6 MB
const MAX_VIDEO_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

const dedupe = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean)));

const tryParseJson = <T>(value: unknown): T | undefined => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [] as unknown as T;
    try {
      return JSON.parse(trimmed) as T;
    } catch (error) {
      return undefined;
    }
  }

  if (Array.isArray(value) || (value && typeof value === "object")) {
    return value as T;
  }

  return undefined;
};

const extractStringArray = (value: unknown): string[] | undefined => {
  if (value === undefined || value === null) return undefined;

  if (typeof value === "string") {
    const parsed = tryParseJson<unknown>(value);
    if (parsed !== undefined) {
      return extractStringArray(parsed);
    }
    const single = value.trim();
    return single ? [single] : [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item : undefined))
      .filter((item): item is string => Boolean(item && item.trim().length > 0));
  }

  return undefined;
};

const sanitizeMediaRecord = (value: unknown): MediaRecord | null => {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  const rawUrl = typeof candidate.url === "string" ? candidate.url.trim() : "";
  if (!rawUrl) return null;

  const publicId =
    typeof candidate.public_id === "string" && candidate.public_id.trim().length > 0
      ? candidate.public_id.trim()
      : undefined;

  const type: SupportedMediaType = candidate.type === "video" ? "video" : "image";

  return { url: rawUrl, public_id: publicId, type };
};

const sanitizeMediaRecordList = (value: unknown): MediaRecord[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => sanitizeMediaRecord(item))
    .filter((item): item is MediaRecord => item !== null);
};

const dedupeMediaRecords = (records: MediaRecord[]): MediaRecord[] => {
  const map = new Map<string, MediaRecord>();
  records.forEach((record) => {
    const key = `${record.type}::${record.url}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...record });
    } else if (!existing.public_id && record.public_id) {
      map.set(key, { ...record });
    }
  });
  return Array.from(map.values());
};

const collectUrlsByType = (records: MediaRecord[], type: SupportedMediaType): string[] =>
  records.filter((record) => record.type === type && record.url).map((record) => record.url);

const createRecordFromUrl = (url: string, type: SupportedMediaType): MediaRecord | null => {
  const trimmed = typeof url === "string" ? url.trim() : "";
  if (!trimmed) return null;
  return { url: trimmed, type };
};

const gatherMediaFromBody = (
  body: Record<string, unknown>
): {
  images?: string[];
  videos?: string[];
  mediaRecords?: MediaRecord[];
} => {
  const imagesInput = extractStringArray(body.images);
  const videosInput = extractStringArray(body.videos);
  const mediaInput = sanitizeMediaRecordList(body.media);

  let records: MediaRecord[] | undefined = mediaInput.length ? dedupeMediaRecords(mediaInput) : undefined;

  if (!records && ((imagesInput && imagesInput.length) || (videosInput && videosInput.length))) {
    const derived: MediaRecord[] = [];
    imagesInput?.forEach((url) => {
      const trimmed = typeof url === "string" ? url.trim() : "";
      if (trimmed) {
        derived.push({ url: trimmed, type: "image" });
      }
    });
    videosInput?.forEach((url) => {
      const trimmed = typeof url === "string" ? url.trim() : "";
      if (trimmed) {
        derived.push({ url: trimmed, type: "video" });
      }
    });
    if (derived.length) {
      records = dedupeMediaRecords(derived);
    }
  }

  const aggregatedImages: string[] = [];
  const aggregatedVideos: string[] = [];

  if (imagesInput) {
    aggregatedImages.push(...imagesInput);
  }
  if (videosInput) {
    aggregatedVideos.push(...videosInput);
  }

  (records ?? []).forEach((item) => {
    if (item.type === "video") {
      aggregatedVideos.push(item.url);
    } else {
      aggregatedImages.push(item.url);
    }
  });

  return {
    images: imagesInput !== undefined || (records && records.length) ? dedupe(aggregatedImages) : undefined,
    videos: videosInput !== undefined || (records && records.length) ? dedupe(aggregatedVideos) : undefined,
    mediaRecords: records,
  };
};

const extractPublicIds = (...values: unknown[]): string[] => {
  const collected: string[] = [];
  values.forEach((value) => {
    const parsed = extractStringArray(value);
    if (parsed) {
      collected.push(...parsed);
    }
  });
  return dedupe(collected);
};

const determineMediaType = (mimetype: string): SupportedMediaType | null => {
  if (IMAGE_MIME_TYPES.has(mimetype)) return "image";
  if (VIDEO_MIME_TYPES.has(mimetype)) return "video";
  return null;
};

const validateIncomingFile = (
  file: Express.Multer.File | undefined
): { valid: boolean; type?: SupportedMediaType; errorMessage?: string } => {
  if (!file) {
    return { valid: false, errorMessage: "No file provided." };
  }

  const detectedType = determineMediaType(file.mimetype);
  if (!detectedType) {
    return { valid: false, errorMessage: "Invalid file type" };
  }

  const limit = detectedType === "image" ? MAX_IMAGE_SIZE_BYTES : MAX_VIDEO_SIZE_BYTES;
  if (file.size > limit) {
    return { valid: false, errorMessage: "File too large" };
  }

  return { valid: true, type: detectedType };
};

const appendUploadOutcome = (
  outcome: { url: string | null; public_id: string | null },
  fallbackName: string,
  mediaType: SupportedMediaType,
  targets: { images: string[]; videos: string[]; records: MediaRecord[] }
) => {
  if (outcome.url) {
    if (mediaType === "video") {
      targets.videos.push(outcome.url);
    } else {
      targets.images.push(outcome.url);
    }

    targets.records.push({ url: outcome.url, public_id: outcome.public_id ?? undefined, type: mediaType });
    return;
  }

  console.error(
    "Cloudinary upload for %s did not return a URL; skipping media persistence",
    fallbackName
  );
};

const parseMaxTickets = (body: Record<string, unknown>): number | undefined => {
  const candidate =
    body.maxTickets ??
    body.max_tickets ??
    body.available_seats ??
    body.availableSeats ??
    body.totalTickets;

  if (candidate === undefined || candidate === null) {
    return undefined;
  }

  const numeric = Number(candidate);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return undefined;
  }

  return Math.floor(numeric);
};

const buildEventResponse = (event: IEvent) => {
  const mediaRecords = sanitizeMediaRecordList((event as unknown as { media?: unknown }).media);
  const mergedImages = dedupe([...(event.images ?? []), ...collectUrlsByType(mediaRecords, "image")]);
  const mergedVideos = dedupe([...(event.videos ?? []), ...collectUrlsByType(mediaRecords, "video")]);

  return {
    _id: (event._id as any).toString(),
    title: event.title,
    description: event.description,
    date: event.date,
    location: event.location,
    venue: event.location,
    event_type: "general",
    price: 0,
    available_seats: event.maxTickets,
    image_url: mergedImages.length > 0 ? mergedImages[0] : undefined,
    organizer_id: event.organizerId ? (event.organizerId as any).toString() : undefined,
    organizationId: (event as any).organizationId ? (event as any).organizationId.toString() : undefined,
    organization_id: (event as any).organizationId ? (event as any).organizationId.toString() : undefined,
    created_at: event.createdAt,
    popularity_score: 0,
    images: mergedImages,
    videos: mergedVideos,
    media: mediaRecords,
  };
};

// ------------------- CREATE EVENT (Admin Only) -------------------
export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    if (!["admin", "organizer", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions to create events" });
    }

    const body = req.body as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title : undefined;
    const description = body.description as string | undefined;
    const location = typeof body.location === "string" ? body.location : undefined;
    const { images, videos, mediaRecords } = gatherMediaFromBody(body);

    const parsedMaxTickets = parseMaxTickets(body);
    if (parsedMaxTickets === undefined) {
      return res.status(400).json({ message: "maxTickets or available_seats is required" });
    }

    const rawDate = body.date;
    const eventDate =
      rawDate instanceof Date
        ? rawDate
        : typeof rawDate === "string"
        ? new Date(rawDate)
        : undefined;

    if (!title || !location || !eventDate || Number.isNaN(eventDate.getTime())) {
      return res.status(400).json({ message: "Invalid event payload" });
    }

    if (!description || (typeof description === "string" && description.trim().length === 0)) {
      return res.status(400).json({ message: "Event description is required" });
    }

    const sanitizedDescription = description.trim();

    const requestedOrganizerId =
      typeof body.organizer_id === "string"
        ? body.organizer_id
        : typeof body.organizerId === "string"
        ? body.organizerId
        : undefined;

    const requestedOrganizationId =
      typeof body.organizationId === "string" && body.organizationId.trim().length
        ? body.organizationId.trim()
        : typeof body.organization_id === "string" && body.organization_id.trim().length
        ? body.organization_id.trim()
        : undefined;

    const requesterId = req.user._id.toString();
    const isAdminLike = req.user.role === "admin" || req.user.role === "superadmin";
    const isOrganizer = req.user.role === "organizer";

    let organizerObjectId: mongoose.Types.ObjectId;
    let organizationObjectId: mongoose.Types.ObjectId | undefined;

    if (isOrganizer) {
      if (!req.user.organizationId) {
        return res.status(403).json({ message: "Organizer not assigned to organization" });
      }
      organizationObjectId = req.user.organizationId as mongoose.Types.ObjectId;
    }

    if (requestedOrganizerId) {
      if (!mongoose.Types.ObjectId.isValid(requestedOrganizerId)) {
        return res.status(400).json({ message: "Invalid organizer_id" });
      }

      if (!isAdminLike && requestedOrganizerId !== requesterId) {
        return res
          .status(403)
          .json({ message: "Organizers can only create events for themselves" });
      }

      organizerObjectId = new mongoose.Types.ObjectId(requestedOrganizerId);
    } else {
      organizerObjectId = new mongoose.Types.ObjectId(requesterId);
    }

    if (!organizationObjectId) {
      const candidateOrgId = requestedOrganizationId ?? (req.user.organizationId ? req.user.organizationId.toString() : undefined);

      if (candidateOrgId) {
        if (!mongoose.Types.ObjectId.isValid(candidateOrgId)) {
          return res.status(400).json({ message: "Invalid organizationId" });
        }

        if (
          req.user.organizationId &&
          req.user.organizationId.toString() !== candidateOrgId &&
          req.user.role === "admin"
        ) {
          return res.status(403).json({ message: "Admin cannot create events for other organizations" });
        }

        organizationObjectId = new mongoose.Types.ObjectId(candidateOrgId);
      }
    }

    if (!organizationObjectId) {
      return res.status(400).json({ message: "organizationId is required to create events" });
    }

    const baseImages = images ?? (mediaRecords ? collectUrlsByType(mediaRecords, "image") : undefined);
    const baseVideos = videos ?? (mediaRecords ? collectUrlsByType(mediaRecords, "video") : undefined);

    const mediaTargets = {
      images: baseImages ? [...baseImages] : [],
      videos: baseVideos ? [...baseVideos] : [],
      records: mediaRecords ? [...mediaRecords] : [],
    };

    if (req.file) {
      const validation = validateIncomingFile(req.file);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.errorMessage });
      }

      const file = req.file as Express.Multer.File;
      const uploadResult = await uploadToCloudinary({
        buffer: file.buffer,
        originalName: file.originalname,
        mimetype: file.mimetype,
        folder: validation.type === "video" ? "events/videos" : "events/images",
        typeOverride: validation.type,
      });

      appendUploadOutcome(uploadResult, file.originalname, validation.type as SupportedMediaType, mediaTargets);
    }

    const mergedRecords = dedupeMediaRecords([
      ...mediaTargets.records,
      ...mediaTargets.images
        .map((url) => createRecordFromUrl(url, "image"))
        .filter((item): item is MediaRecord => item !== null),
      ...mediaTargets.videos
        .map((url) => createRecordFromUrl(url, "video"))
        .filter((item): item is MediaRecord => item !== null),
    ]);

    const finalImages = collectUrlsByType(mergedRecords, "image");
    const finalVideos = collectUrlsByType(mergedRecords, "video");

    const newEvent = new Event({
      title,
      description: sanitizedDescription,
      date: eventDate,
      location,
      organizerId: organizerObjectId,
      organizationId: organizationObjectId,
      createdBy: req.user._id,
      maxTickets: parsedMaxTickets,
      images: dedupe(finalImages),
      videos: dedupe(finalVideos),
      media: mergedRecords,
    });

    await newEvent.save();
    const eventPayload = buildEventResponse(newEvent);

    res.status(201).json({ message: "Event created", event: eventPayload });
  } catch (err) {
    console.error("Create Event Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------- GET EVENTS FOR ORGANIZER -------------------
export const getOrganizerEvents = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const requesterId = req.user._id.toString();
    const requestedOrganizerId =
      typeof req.query.organizerId === "string" && req.query.organizerId.trim()
        ? req.query.organizerId.trim()
        : requesterId;

    const isAdminLike = req.user.role === "admin" || req.user.role === "superadmin";
    if (!isAdminLike && requestedOrganizerId !== requesterId) {
      return res
        .status(403)
        .json({ message: "Organizers cannot view other organizers' events" });
    }

    if (!mongoose.Types.ObjectId.isValid(requestedOrganizerId)) {
      return res.status(400).json({ message: "Invalid organizer id" });
    }

    const organizerObjectId = new mongoose.Types.ObjectId(requestedOrganizerId);
    const filters: Record<string, unknown> = { organizerId: organizerObjectId };

    if (req.user.role === "organizer") {
      if (!req.user.organizationId) {
        return res.status(403).json({ message: "Organizer not assigned to organization" });
      }
      filters.organizationId = req.user.organizationId;
    } else if (req.user.role === "admin" && req.user.organizationId) {
      filters.organizationId = req.user.organizationId;
    }

    const events = await Event.find(filters).sort({ date: 1 });
    const transformed = events.map(buildEventResponse);

    res.status(200).json({ events: transformed });
  } catch (err) {
    console.error("Get Organizer Events Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------- UPDATE EVENT (Admin Only) -------------------
export const updateEvent = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const isAdminLike = req.user.role === "admin" || req.user.role === "superadmin";
    const isOrganizer = req.user.role === "organizer";

    if (!isAdminLike && !isOrganizer) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { eventId } = req.params;
    const body = req.body as Record<string, unknown>;

    if (!mongoose.Types.ObjectId.isValid(eventId))
      return res.status(400).json({ message: "Invalid event ID" });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (!isAdminLike && event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to modify this event" });
    }

    if (
      req.user.role === "admin" &&
      req.user.organizationId &&
      event.organizationId &&
      event.organizationId.toString() !== req.user.organizationId.toString()
    ) {
      return res.status(403).json({ message: "Admin cannot modify events for other organizations" });
    }

    const existingRecords = sanitizeMediaRecordList((event as unknown as { media?: unknown }).media);
    const { images, videos, mediaRecords } = gatherMediaFromBody(body);

    let workingRecords = mediaRecords !== undefined ? [...mediaRecords] : [...existingRecords];

    if (mediaRecords === undefined) {
      if (images !== undefined) {
        workingRecords = workingRecords.filter((record) => record.type !== "image");
        images.forEach((url) => {
          const trimmed = typeof url === "string" ? url.trim() : "";
          if (trimmed) {
            workingRecords.push({ url: trimmed, type: "image" });
          }
        });
      }

      if (videos !== undefined) {
        workingRecords = workingRecords.filter((record) => record.type !== "video");
        videos.forEach((url) => {
          const trimmed = typeof url === "string" ? url.trim() : "";
          if (trimmed) {
            workingRecords.push({ url: trimmed, type: "video" });
          }
        });
      }
    }

    workingRecords = dedupeMediaRecords(workingRecords);

    const derivedImageUrls = collectUrlsByType(workingRecords, "image");
    const derivedVideoUrls = collectUrlsByType(workingRecords, "video");

    let workingImages =
      images !== undefined
        ? [...images]
        : derivedImageUrls.length
        ? derivedImageUrls
        : [...(event.images ?? [])];

    let workingVideos =
      videos !== undefined
        ? [...videos]
        : derivedVideoUrls.length
        ? derivedVideoUrls
        : [...(event.videos ?? [])];

    const mediaTargets = { images: workingImages, videos: workingVideos, records: workingRecords };

    if (req.file) {
      const validation = validateIncomingFile(req.file);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.errorMessage });
      }

      const file = req.file as Express.Multer.File;
      const uploadResult = await uploadToCloudinary({
        buffer: file.buffer,
        originalName: file.originalname,
        mimetype: file.mimetype,
        folder: validation.type === "video" ? "events/videos" : "events/images",
        typeOverride: validation.type,
      });

      appendUploadOutcome(uploadResult, file.originalname, validation.type as SupportedMediaType, mediaTargets);
      workingRecords = mediaTargets.records;
    }

    const removedPublicIds = extractPublicIds(
      (req.body as Record<string, unknown>).removedMediaPublicIds,
      (req.body as Record<string, unknown>).removeMediaPublicIds,
      (req.body as Record<string, unknown>).removedMedia
    );

    if (removedPublicIds.length) {
      await Promise.all(removedPublicIds.map((publicId) => deleteByPublicId(publicId)));
      const removalSet = new Set(removedPublicIds);
      workingRecords = workingRecords.filter((record) => !(record.public_id && removalSet.has(record.public_id)));
      workingImages = workingImages.filter((url) =>
        workingRecords.some((record) => record.type === "image" && record.url === url)
      );
      workingVideos = workingVideos.filter((url) =>
        workingRecords.some((record) => record.type === "video" && record.url === url)
      );
    }

    const mergedRecords = dedupeMediaRecords([
      ...workingRecords,
      ...workingImages
        .map((url) => createRecordFromUrl(url, "image"))
        .filter((item): item is MediaRecord => item !== null),
      ...workingVideos
        .map((url) => createRecordFromUrl(url, "video"))
        .filter((item): item is MediaRecord => item !== null),
    ]);

    const finalImages = collectUrlsByType(mergedRecords, "image");
    const finalVideos = collectUrlsByType(mergedRecords, "video");

    const parsedMaxTickets = parseMaxTickets(body);

    const updatePayload: Partial<IEvent> = {
      title: typeof body.title === "string" ? body.title : event.title,
      location: typeof body.location === "string" ? body.location : event.location,
      maxTickets: parsedMaxTickets ?? event.maxTickets,
      images: dedupe(finalImages),
      videos: dedupe(finalVideos),
      media: mergedRecords,
      organizationId: event.organizationId ?? undefined,
    };

    if (typeof body.description === "string") {
      const trimmedDescription = body.description.trim();
      if (!trimmedDescription) {
        return res.status(400).json({ message: "Event description cannot be empty" });
      }
      updatePayload.description = trimmedDescription;
    } else {
      updatePayload.description = event.description;
    }

    if (body.date instanceof Date && !Number.isNaN(body.date.getTime())) {
      updatePayload.date = body.date;
    } else if (typeof body.date === "string") {
      const candidateDate = new Date(body.date);
      if (!Number.isNaN(candidateDate.getTime())) {
        updatePayload.date = candidateDate;
      }
    } else {
      updatePayload.date = event.date;
    }

    if (isAdminLike) {
      const requestedOrganizerId =
        typeof body.organizer_id === "string"
          ? body.organizer_id
          : typeof body.organizerId === "string"
          ? body.organizerId
          : undefined;

      if (requestedOrganizerId) {
        if (!mongoose.Types.ObjectId.isValid(requestedOrganizerId)) {
          return res.status(400).json({ message: "Invalid organizer_id" });
        }
        updatePayload.organizerId = new mongoose.Types.ObjectId(requestedOrganizerId);
      }
    }

    const updatedEvent = await Event.findByIdAndUpdate(eventId, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!updatedEvent) return res.status(404).json({ message: "Event not found" });

    const eventPayload = buildEventResponse(updatedEvent);

    res.status(200).json({ message: "Event updated", event: eventPayload });
  } catch (err) {
    console.error("Update Event Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------- DELETE EVENT (Admin Only) -------------------
export const deleteEvent = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const isAdminLike = req.user.role === "admin" || req.user.role === "superadmin";
    const isOrganizer = req.user.role === "organizer";

    if (!isAdminLike && !isOrganizer) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId))
      return res.status(400).json({ message: "Invalid event ID" });

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (!isAdminLike && event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this event" });
    }

    await event.deleteOne();

    res.status(200).json({ message: "Event deleted" });
  } catch (err) {
    console.error("Delete Event Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------- GET ALL EVENTS (Public) -------------------
export const getAllEvents = async (req: AuthRequest, res: Response) => {
  try {
    const filter: Record<string, unknown> = {};
    if (typeof req.query.organizerId === "string" && req.query.organizerId.trim()) {
      if (!mongoose.Types.ObjectId.isValid(req.query.organizerId)) {
        return res.status(400).json({ message: "Invalid organizer id" });
      }
      filter.organizerId = new mongoose.Types.ObjectId(req.query.organizerId.trim());
    }

    // Tell TS that this returns IEvent[]
    const events: IEvent[] = await Event.find(filter).sort({ date: 1 });

    const transformed = events.map((ev: IEvent) => buildEventResponse(ev));

    return res.status(200).json({
      events: transformed,
      totalEvents: transformed.length,
    });
  } catch (err) {
    console.error("Get All Events Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------- GET SINGLE EVENT (Public) -------------------
export const getEventById = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;

    // Frontend may still pass dummy IDs like "dummy-0001", not valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(404).json({ message: "Event not found" });
    }

    const ev: IEvent | null = await Event.findById(eventId);
    if (!ev) {
      return res.status(404).json({ message: "Event not found" });
    }

    const transformed = buildEventResponse(ev);

    return res.status(200).json(transformed);
  } catch (err) {
    console.error("Get Event By ID Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
