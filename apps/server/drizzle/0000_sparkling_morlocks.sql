CREATE TABLE `files` (
	`id` text PRIMARY KEY NOT NULL,
	`device_id` text NOT NULL,
	`original_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`relative_path` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`device_id` text NOT NULL,
	`tool_id` text NOT NULL,
	`status` text NOT NULL,
	`input_json` text NOT NULL,
	`source_file_ids_json` text NOT NULL,
	`result_relative_path` text,
	`result_mime_type` text,
	`provider` text NOT NULL,
	`provider_model` text NOT NULL,
	`provider_request_id` text,
	`provider_raw_json` text,
	`error_message` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
