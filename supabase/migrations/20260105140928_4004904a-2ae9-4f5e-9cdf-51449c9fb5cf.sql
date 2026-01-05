-- Create table for church events
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  location TEXT,
  event_type TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for YouTube videos/gallery
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  youtube_video_id TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for contact form submissions
CREATE TABLE public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for church info (single row for site-wide settings)
CREATE TABLE public.church_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_name TEXT NOT NULL DEFAULT 'Shiloh Intercession Mountain',
  address TEXT,
  phone TEXT,
  email TEXT,
  mission_statement TEXT,
  vision_statement TEXT,
  youtube_channel_url TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  google_maps_embed_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for service times
CREATE TABLE public.service_times (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name TEXT NOT NULL,
  day_of_week TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_times ENABLE ROW LEVEL SECURITY;

-- Public read access for events (everyone can view active events)
CREATE POLICY "Anyone can view active events" 
ON public.events 
FOR SELECT 
USING (is_active = true);

-- Public read access for videos (everyone can view active videos)
CREATE POLICY "Anyone can view active videos" 
ON public.videos 
FOR SELECT 
USING (is_active = true);

-- Anyone can submit contact forms
CREATE POLICY "Anyone can submit contact forms" 
ON public.contact_submissions 
FOR INSERT 
WITH CHECK (true);

-- Public read access for church info
CREATE POLICY "Anyone can view church info" 
ON public.church_info 
FOR SELECT 
USING (true);

-- Public read access for service times
CREATE POLICY "Anyone can view active service times" 
ON public.service_times 
FOR SELECT 
USING (is_active = true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_church_info_updated_at
  BEFORE UPDATE ON public.church_info
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default church info
INSERT INTO public.church_info (
  church_name,
  address,
  phone,
  email,
  mission_statement,
  vision_statement,
  google_maps_embed_url
) VALUES (
  'Shiloh Intercession Mountain',
  '123 Church Street, Johannesburg, South Africa',
  '+27 11 123 4567',
  'info@shilohim.org',
  'To create a house of prayer for all nations, where every believer can encounter God''s presence, grow in faith, and be equipped to transform their communities through the power of prayer and the gospel of Jesus Christ.',
  'To see lives transformed, families restored, and communities revived through the power of intercessory prayer and the uncompromising preaching of God''s Word, raising a generation of prayer warriors across the nations.',
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d114595.77558147967!2d28.004739999999998!3d-26.195246!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1e950c68f0406a51%3A0x238ac9d9b1d34041!2sJohannesburg%2C%20South%20Africa!5e0!3m2!1sen!2sus!4v1234567890'
);

-- Insert default service times
INSERT INTO public.service_times (service_name, day_of_week, start_time, end_time, display_order) VALUES
  ('Sunday Worship Service', 'Sunday', '09:00', '12:00', 1),
  ('Wednesday Prayer Meeting', 'Wednesday', '18:00', '20:00', 2),
  ('Friday Night Vigil', 'Friday', '22:00', '02:00', 3);

-- Insert sample events
INSERT INTO public.events (title, description, event_date, start_time, end_time, location, event_type) VALUES
  ('Sunday Worship Service', 'Join us for a powerful time of worship and the Word of God. All are welcome to experience the presence of God with us.', '2026-01-11', '09:00', '12:00', 'Main Sanctuary', 'weekly'),
  ('New Year Prayer Conference', 'A three-day prayer conference to seek God''s direction for the new year. Featuring guest speakers and powerful intercession.', '2026-01-15', '18:00', '21:00', 'Main Sanctuary', 'special'),
  ('Youth Revival Weekend', 'A weekend dedicated to the youth. Games, worship, teaching, and fellowship for young people ages 13-25.', '2026-01-24', '16:00', '20:00', 'Youth Hall', 'youth'),
  ('Women''s Fellowship Breakfast', 'A special morning gathering for women of all ages. Enjoy fellowship, breakfast, and an inspiring message.', '2026-02-07', '08:00', '11:00', 'Fellowship Hall', 'fellowship');

-- Insert sample videos
INSERT INTO public.videos (title, youtube_video_id, display_order) VALUES
  ('Sunday Worship Highlights', 'dQw4w9WgXcQ', 1),
  ('Pastor''s Message: Faith in Action', 'dQw4w9WgXcQ', 2),
  ('Youth Conference 2025', 'dQw4w9WgXcQ', 3),
  ('Christmas Celebration Service', 'dQw4w9WgXcQ', 4),
  ('Prayer & Deliverance Service', 'dQw4w9WgXcQ', 5),
  ('Women''s Ministry Conference', 'dQw4w9WgXcQ', 6);