CREATE TABLE `fdl_task_group` (
  `id` varchar(255) COLLATE utf8_bin NOT NULL,
  `judgement` longtext COLLATE utf8_bin,
  `name` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `plan_id` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `status` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDXgb8pjymjfioi93i7f9sgaeyvq` (`plan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;