CREATE TABLE `fdl_plan_schedule` (
  `id` varchar(255) COLLATE utf8_bin NOT NULL,
  `add_time` varchar(255) COLLATE utf8_bin NOT NULL,
  `business_type` int DEFAULT NULL,
  `plan_detail` varchar(4000) COLLATE utf8_bin NOT NULL,
  `plan_id` varchar(255) COLLATE utf8_bin NOT NULL,
  `schedule` longtext COLLATE utf8_bin NOT NULL,
  `schedule_id` varchar(255) COLLATE utf8_bin NOT NULL,
  `schedule_type` varchar(255) COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`id`),
  KEY `IDXomnq1ivl80cljdnh187sqo50w` (`plan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;