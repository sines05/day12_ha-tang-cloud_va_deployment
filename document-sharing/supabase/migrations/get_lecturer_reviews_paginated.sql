DECLARE
    total_reviews bigint;
    reviews_data json;
    offset_val integer;
BEGIN
    offset_val := (page_input - 1) * limit_input;

    -- 1. Count total *approved* reviews for pagination
    SELECT COUNT(*) INTO total_reviews 
    FROM public.reviews 
    WHERE lecturer_id = lecturer_id_input AND status = 'approved';

    -- 2. Fetch paginated *approved* reviews and their *approved* comments
    SELECT json_agg(t) INTO reviews_data FROM (
        SELECT
            r.id,
            r.rating,
            r.content,
            r.created_at AS "createdAt",
            c.name AS "courseName",
            c.code AS "courseCode",
            (
                SELECT COALESCE(json_agg(cm), '[]'::json) FROM (
                    SELECT
                        cmt.id,
                        cmt.author_name AS "authorName",
                        cmt.content,
                        cmt.created_at AS "createdAt"
                    FROM public.comments cmt
                    WHERE cmt.review_id = r.id AND cmt.status = 'approved'
                    ORDER BY cmt.created_at ASC
                ) cm
            ) as comments
        FROM public.reviews r
        LEFT JOIN public.courses c ON r.course_id = c.id
        WHERE r.lecturer_id = lecturer_id_input AND r.status = 'approved'
        ORDER BY r.created_at DESC
        LIMIT limit_input
        OFFSET offset_val
    ) t;

    -- 3. Return the result object
    RETURN json_build_object(
        'data', COALESCE(reviews_data, '[]'::json),
        'pagination', json_build_object(
            'currentPage', page_input,
            'totalPages', CEIL(total_reviews::numeric / limit_input),
            'totalItems', total_reviews,
            'limit', limit_input
        )
    );
END;