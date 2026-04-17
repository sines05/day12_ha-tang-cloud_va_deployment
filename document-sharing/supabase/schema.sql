-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.access_logs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address text,
  country text,
  method text,
  path text,
  user_agent text,
  status_code integer,
  CONSTRAINT access_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.comments (
  id integer NOT NULL DEFAULT nextval('comments_id_seq'::regclass),
  review_id integer NOT NULL,
  author_name character varying,
  content text NOT NULL,
  author_ip character varying,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::content_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id)
);
CREATE TABLE public.courses (
  id integer NOT NULL DEFAULT nextval('courses_id_seq'::regclass),
  code character varying,
  name character varying NOT NULL,
  university_id character varying,
  CONSTRAINT courses_pkey PRIMARY KEY (id),
  CONSTRAINT courses_university_id_fkey FOREIGN KEY (university_id) REFERENCES public.universities(id)
);
CREATE TABLE public.document_files (
  id integer NOT NULL DEFAULT nextval('document_files_id_seq'::regclass),
  section_id integer NOT NULL,
  name character varying NOT NULL,
  file_type USER-DEFINED NOT NULL,
  size_kb integer,
  telegram_file_id text NOT NULL,
  is_multipart boolean DEFAULT false,
  CONSTRAINT document_files_pkey PRIMARY KEY (id),
  CONSTRAINT document_files_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.document_sections(id)
);
CREATE TABLE public.document_sections (
  id integer NOT NULL DEFAULT nextval('document_sections_id_seq'::regclass),
  document_id integer NOT NULL,
  title character varying NOT NULL,
  display_order integer DEFAULT 0,
  CONSTRAINT document_sections_pkey PRIMARY KEY (id),
  CONSTRAINT document_sections_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id)
);
CREATE TABLE public.documents (
  id integer NOT NULL DEFAULT nextval('documents_id_seq'::regclass),
  title character varying NOT NULL,
  description text,
  course_id integer,
  lecturer_id integer,
  uploader_ip character varying,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::content_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  university_id character varying,
  slug text UNIQUE,
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT documents_lecturer_id_fkey FOREIGN KEY (lecturer_id) REFERENCES public.lecturers(id)
);
CREATE TABLE public.lecturers (
  id integer NOT NULL DEFAULT nextval('lecturers_id_seq'::regclass),
  name character varying NOT NULL,
  university_id character varying,
  slug text UNIQUE,
  email text,
  scholar_link text,
  linkedin_link text,
  website_link text,
  avatar_url text,
  last_indexed_at timestamp with time zone,
  CONSTRAINT lecturers_pkey PRIMARY KEY (id),
  CONSTRAINT lecturers_university_id_fkey FOREIGN KEY (university_id) REFERENCES public.universities(id)
);
CREATE TABLE public.reviews (
  id integer NOT NULL DEFAULT nextval('reviews_id_seq'::regclass),
  lecturer_id integer NOT NULL,
  course_id integer NOT NULL,
  rating smallint CHECK (rating >= 1 AND rating <= 5),
  content text,
  author_ip character varying,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::content_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_lecturer_id_fkey FOREIGN KEY (lecturer_id) REFERENCES public.lecturers(id),
  CONSTRAINT reviews_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.universities (
  id character varying NOT NULL,
  name character varying NOT NULL,
  abbreviation character varying NOT NULL,
  CONSTRAINT universities_pkey PRIMARY KEY (id)
);