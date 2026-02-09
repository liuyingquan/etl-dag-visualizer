CREATE TABLE `fdl_catalog` (
  `id` varchar(255) COLLATE utf8_bin NOT NULL,
  `catalog_type` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `create_time` bigint DEFAULT NULL,
  `create_user` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `description` varchar(1000) COLLATE utf8_bin DEFAULT NULL,
  `name` varchar(1000) COLLATE utf8_bin DEFAULT NULL,
  `pid` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `resource_id` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `resource_type` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `sort_index` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKgk0sxnmd6uako9h1bwfx9eb4k` (`resource_id`,`resource_type`),
  KEY `IDXs04qlwb0n0le471jvixljj1e5` (`resource_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;