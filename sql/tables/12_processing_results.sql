-- 处理结果表
CREATE TABLE processing_results (
    id BIGSERIAL PRIMARY KEY,

    -- 外键：对应 upload_files.id
    upload_file_id BIGINT NOT NULL REFERENCES upload_files(id) ON DELETE CASCADE,
    -- 任务ID，一个任务对应一个文件
    task_id VARCHAR(50),
    task_status VARCHAR(20),
    task_message TEXT,

    -- 处理耗时
    processing_time_ms BIGINT,

    -- 时间戳
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);


