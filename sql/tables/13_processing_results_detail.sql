-- 处理结果详细表
CREATE TABLE processing_results_detail (
    id BIGSERIAL PRIMARY KEY,

    -- 外键：对应 upload_files.id
    upload_file_id BIGINT NOT NULL REFERENCES upload_files(id) ON DELETE CASCADE,

    -- 结果类型（非常重要）
    result_type VARCHAR(50) NOT NULL,
    -- e.g. 'vocals', 'instrumental', 'accompaniment', 'stem_drums', 'preview'

    -- R2 文件信息
    r2_key VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),

    -- 时间戳
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);


