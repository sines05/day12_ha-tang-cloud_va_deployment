BEGIN
    RETURN (
        SELECT jsonb_agg(lecturer_reviews)
        FROM (
            SELECT
                l.id AS "lecturerId",
                l.name AS "lecturerName",
                l.university_id AS "universityId",
                COALESCE((
                    SELECT jsonb_agg(review_details)
                    FROM (
                        SELECT
                            r.id,
                            r.rating,
                            r.content,
                            r.created_at AS "createdAt",
                            c.name AS "courseName",
                            COALESCE((
                                SELECT jsonb_agg(comment_details)
                                FROM (
                                    SELECT
                                        cm.id,
                                        cm.author_name as "authorName",
                                        cm.content,
                                        cm.created_at as "createdAt"
                                    FROM comments cm
                                    WHERE cm.review_id = r.id AND cm.status = 'approved'
                                    ORDER BY cm.created_at ASC
                                ) comment_details
                            ), '[]'::jsonb) AS comments
                        FROM reviews r
                        JOIN courses c ON r.course_id = c.id
                        WHERE r.lecturer_id = l.id AND r.status = 'approved'
                        AND (review_content_filter IS NULL OR review_content_filter = '' OR unaccent(r.content) ILIKE unaccent('%' || review_content_filter || '%'))
                        AND (course_name_filter IS NULL OR course_name_filter = '' OR unaccent(c.name) ILIKE unaccent('%' || course_name_filter || '%'))
                        ORDER BY r.created_at DESC
                    ) review_details
                ), '[]'::jsonb) AS reviews
            FROM lecturers l
            JOIN reviews r_join ON l.id = r_join.lecturer_id AND r_join.status = 'approved'
            JOIN courses c_join ON r_join.course_id = c_join.id
            WHERE
                (university_id_filter IS NULL OR l.university_id = university_id_filter)
                AND (lecturer_name_filter IS NULL OR lecturer_name_filter = '' OR unaccent(l.name) ILIKE unaccent('%' || lecturer_name_filter || '%'))
            GROUP BY l.id, l.name, l.university_id
            ORDER BY MAX(r_join.created_at) DESC
        ) lecturer_reviews
        WHERE jsonb_array_length(lecturer_reviews.reviews) > 0
    );
END;