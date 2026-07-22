ALTER TABLE `users` ADD `password` varchar(255) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `users` ADD `created_at` timestamp DEFAULT (now());