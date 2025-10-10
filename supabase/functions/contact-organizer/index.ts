import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactRequest {
  organizerId: string;
  organizerName: string;
  organizerEmail: string;
  eventTitle: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      organizerName, 
      organizerEmail, 
      eventTitle, 
      senderName, 
      senderEmail, 
      subject, 
      message 
    }: ContactRequest = await req.json();

    console.log('Sending contact email to organizer:', organizerEmail);

    // Send email to organizer
    const emailResponse = await resend.emails.send({
      from: "Zevo Events <noreply@resend.dev>",
      to: [organizerEmail],
      replyTo: [senderEmail],
      subject: `Event Inquiry: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            New Event Inquiry
          </h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #495057; margin-top: 0;">Event: ${eventTitle}</h3>
            <p><strong>From:</strong> ${senderName} (${senderEmail})</p>
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h4 style="color: #495057;">Message:</h4>
            <div style="background-color: #ffffff; padding: 15px; border-left: 4px solid #007bff; border-radius: 4px;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
          
          <hr style="margin: 30px 0; border: 0; border-top: 1px solid #dee2e6;">
          
          <p style="color: #6c757d; font-size: 14px;">
            You can reply directly to this email to respond to ${senderName}.
            <br><br>
            This message was sent through Zevo Events contact form.
          </p>
        </div>
      `,
    });

    console.log("Contact email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in contact-organizer function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);