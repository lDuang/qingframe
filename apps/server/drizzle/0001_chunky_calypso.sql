CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`count` integer NOT NULL,
	`window_start` text NOT NULL,
	`cooldown_until` integer,
	`updated_at` integer NOT NULL
);
