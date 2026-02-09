CREATE TABLE `fdl_task_group_relation` (
  `id` varchar(255) COLLATE utf8_bin NOT NULL,
  `from_id` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `plan_id` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `to_id` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `from_to_id` (`from_id`,`to_id`),
  KEY `IDXe9e97chx92i7o66kc0wvo3b5q` (`plan_id`),
  KEY `IDXtishtnvh2pdwpstwtii59ou04` (`from_id`),
  KEY `IDX752vo3q9fqv0jtcwim7n3i92k` (`to_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;