CREATE TABLE `fdl_work_info` (
  `id` varchar(255) COLLATE utf8_bin NOT NULL,
  `create_time` bigint DEFAULT NULL,
  `create_user` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `description` varchar(4000) COLLATE utf8_bin DEFAULT NULL,
  `name` varchar(1000) COLLATE utf8_bin NOT NULL,
  `resource_id` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `resource_type` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `update_time` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKgu1jcbblw0yt93abcpypejhqa` (`resource_id`,`resource_type`),
  KEY `IDXeuf8vkmnq2tfsie2ev5784pme` (`resource_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;