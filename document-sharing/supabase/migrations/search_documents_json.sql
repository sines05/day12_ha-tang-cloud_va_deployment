CREATE OR REPLACE FUNCTION search_documents_json(
    search_term text DEFAULT '',
    university_id_filter text DEFAULT NULL,
    page_limit integer DEFAULT 12,
    page_offset integer DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    results JSON;
    total BIGINT;
    search_keywords text[];
    keyword text;
    search_query text;
BEGIN
    -- 1. Chuẩn bị từ khóa: Lowercase, Unaccent, Trim và Tách mảng
    IF search_term IS NOT NULL AND TRIM(search_term) <> '' THEN
        -- Chuyển về chữ thường và bỏ dấu ngay từ đầu vào để so sánh
        search_query := unaccent(lower(trim(search_term)));
        -- Tách thành mảng các từ khóa (ví dụ: 'Kiến trúc' -> ['kiến', 'trúc'])
        search_keywords := string_to_array(search_query, ' ');
    ELSE
        search_keywords := NULL;
    END IF;

    -- 2. Tính tổng số lượng (Total Count)
    SELECT COUNT(*)
    INTO total
    FROM documents d
    LEFT JOIN courses c ON d.course_id = c.id
    LEFT JOIN lecturers l ON d.lecturer_id = l.id
    WHERE
        d.status = 'approved'
        AND (university_id_filter IS NULL OR d.university_id = university_id_filter)
        AND (
            search_keywords IS NULL OR 
            (
                -- Logic: "Mọi từ khóa trong mảng PHẢI xuất hiện trong ít nhất một trường nào đó"
                -- (Tìm kiếm dạng AND)
                NOT EXISTS (
                    SELECT 1
                    FROM unnest(search_keywords) k
                    WHERE NOT (
                        unaccent(lower(d.title)) LIKE '%' || k || '%' OR
                        unaccent(lower(COALESCE(d.description, ''))) LIKE '%' || k || '%' OR
                        unaccent(lower(COALESCE(c.name, ''))) LIKE '%' || k || '%' OR
                        unaccent(lower(COALESCE(c.code, ''))) LIKE '%' || k || '%' OR
                        unaccent(lower(COALESCE(l.name, ''))) LIKE '%' || k || '%'
                    )
                )
            )
        );

    -- 3. Lấy dữ liệu phân trang (Data Pagination)
    SELECT json_agg(t)
    INTO results
    FROM (
        SELECT
            d.id,
            d.slug,
            d.title,
            d.description,
            d.created_at as "createdAt",
            c.name as "courseName",
            c.code as "courseCode",
            l.name as "lecturerName",
            d.university_id as "universityId"
        FROM documents d
        LEFT JOIN courses c ON d.course_id = c.id
        LEFT JOIN lecturers l ON d.lecturer_id = l.id
        WHERE
            d.status = 'approved'
            AND (university_id_filter IS NULL OR d.university_id = university_id_filter)
            AND (
                search_keywords IS NULL OR 
                (
                    NOT EXISTS (
                        SELECT 1
                        FROM unnest(search_keywords) k
                        WHERE NOT (
                            unaccent(lower(d.title)) LIKE '%' || k || '%' OR
                            unaccent(lower(COALESCE(d.description, ''))) LIKE '%' || k || '%' OR
                            unaccent(lower(COALESCE(c.name, ''))) LIKE '%' || k || '%' OR
                            unaccent(lower(COALESCE(c.code, ''))) LIKE '%' || k || '%' OR
                            unaccent(lower(COALESCE(l.name, ''))) LIKE '%' || k || '%'
                        )
                    )
                )
            )
        ORDER BY d.created_at DESC
        LIMIT page_limit
        OFFSET page_offset
    ) t;

    -- 4. Trả về kết quả
    RETURN json_build_object(
        'data', COALESCE(results, '[]'::json),
        'totalCount', total
    );
END;
$$;