-- Add more dummy events for better UI
INSERT INTO public.events (title, description, date, location, event_type, available_seats, organizer_id, image_url) VALUES
('Tech Conference 2024', 'The biggest technology conference featuring AI, ML, and Web3 innovations. Join industry leaders and startups.', '2024-03-15 09:00:00+00', 'Convention Center, Mumbai', 'tech', 500, (SELECT id FROM auth.users LIMIT 1), 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop'),

('Coldplay Concert', 'Experience Coldplay live with their Music of the Spheres World Tour. An unforgettable musical journey awaits.', '2024-03-20 19:00:00+00', 'DY Patil Stadium, Mumbai', 'concerts', 50000, (SELECT id FROM auth.users LIMIT 1), 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop'),

('IPL Cricket Match', 'Mumbai Indians vs Chennai Super Kings - The most anticipated match of the season at Wankhede Stadium.', '2024-04-05 19:30:00+00', 'Wankhede Stadium, Mumbai', 'sports', 33000, (SELECT id FROM auth.users LIMIT 1), 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&h=400&fit=crop'),

('Sunburn Festival 2024', 'Asia''s premier electronic dance music festival returns with the biggest DJs and electronic artists worldwide.', '2024-04-12 16:00:00+00', 'Vagator Beach, Goa', 'festivals', 15000, (SELECT id FROM auth.users LIMIT 1), 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=400&fit=crop'),

('Digital Marketing Workshop', 'Learn the latest digital marketing strategies, social media optimization, and growth hacking techniques.', '2024-03-25 10:00:00+00', 'IIT Bombay, Mumbai', 'workshops', 200, (SELECT id FROM auth.users LIMIT 1), 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop'),

('Stand-Up Comedy Night', 'Laugh out loud with India''s top comedians including Zakir Khan, Rahul Subramanian, and special guests.', '2024-03-18 20:00:00+00', 'Phoenix Marketcity, Pune', 'concerts', 800, (SELECT id FROM auth.users LIMIT 1), 'https://images.unsplash.com/photo-1516962126636-27ad087061cc?w=800&h=400&fit=crop'),

('Basketball Championship', 'Inter-college basketball tournament featuring teams from top universities across India.', '2024-04-08 15:00:00+00', 'Siri Fort Sports Complex, Delhi', 'sports', 2000, (SELECT id FROM auth.users LIMIT 1), 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=400&fit=crop'),

('Startup Pitch Competition', 'Young entrepreneurs showcase their innovative ideas to top investors and industry mentors.', '2024-03-30 14:00:00+00', 'T-Hub, Hyderabad', 'tech', 300, (SELECT id FROM auth.users LIMIT 1), 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=400&fit=crop'),

('Classical Music Concert', 'Ustad Rahat Fateh Ali Khan performs classical and sufi music in an intimate setting.', '2024-04-02 19:00:00+00', 'Nehru Centre, Mumbai', 'concerts', 1200, (SELECT id FROM auth.users LIMIT 1), 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop'),

('Photography Workshop', 'Master the art of photography with professional techniques for portraits, landscapes, and street photography.', '2024-03-22 09:00:00+00', 'India Habitat Centre, Delhi', 'workshops', 150, (SELECT id FROM auth.users LIMIT 1), 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=400&fit=crop'),

('Gaming Tournament - BGMI', 'Battlegrounds Mobile India championship with prize pool of ₹10 lakhs for top teams.', '2024-04-15 11:00:00+00', 'Phoenix Mall, Bangalore', 'tech', 100, (SELECT id FROM auth.users LIMIT 1), 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=400&fit=crop'),

('Food & Wine Festival', 'Taste the finest cuisines from around the world with wine pairings by master sommeliers.', '2024-04-20 18:00:00+00', 'Taj Palace, New Delhi', 'festivals', 5000, (SELECT id FROM auth.users LIMIT 1), 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop');