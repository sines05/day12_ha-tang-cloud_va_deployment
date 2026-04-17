BEGIN
    RETURN QUERY
    SELECT
        l.id,
        l.name,
        l.slug,
        l.university_id,
        l.email,
        l.scholar_link,
        l.linkedin_link,
        l.website_link,
        l.avatar_url,
        u.name as "universityName",
        u.abbreviation,
        (SELECT AVG(r.rating)::float FROM public.reviews r WHERE r.lecturer_id = l.id) as "averageRating",
        (SELECT COUNT(r.id) FROM public.reviews r WHERE r.lecturer_id = l.id) as "totalReviews"
    FROM
        public.lecturers l
    LEFT JOIN
        public.universities u ON l.university_id = u.id
    WHERE
        l.id = lecturer_id_input;
END;