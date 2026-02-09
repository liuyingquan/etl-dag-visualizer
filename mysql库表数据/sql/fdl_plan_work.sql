CREATE TABLE `fdl_plan_work` (
  `id` varchar(255) COLLATE utf8_bin NOT NULL,
  `plan_id` varchar(255) COLLATE utf8_bin NOT NULL,
  `work_id` varchar(255) COLLATE utf8_bin NOT NULL,
  `work_type` varchar(255) COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX97nn0ce6e9051g4qym93m6xpg` (`plan_id`,`work_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;