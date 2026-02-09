CREATE TABLE `fdl_work_last_record` (
  `id` varchar(255) COLLATE utf8_bin NOT NULL,
  `dirtyDataNum` bigint DEFAULT NULL,
  `finishTime` bigint DEFAULT NULL,
  `lastModifiedTime` bigint DEFAULT NULL,
  `lastRecord` bit(1) DEFAULT NULL,
  `path` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `sourceExecuteId` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `startTime` bigint DEFAULT NULL,
  `taskId` varchar(255) COLLATE utf8_bin NOT NULL,
  `taskStatus` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `triggerBy` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `triggerMethod` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `triggerTime` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDXrtgh7jtmiot3utf639ns9yv1s` (`taskId`),
  KEY `IDXn1amujbv5y9ey8xvs8rvvmw1l` (`taskId`,`lastRecord`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;