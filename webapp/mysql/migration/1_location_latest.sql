CREATE TABLE `latest_locations` (
    `tow_truck_id` INT NOT NULL,
    `node_id` INT NOT NULL,
    `timestamp` DATETIME,
    PRIMARY KEY (`tow_truck_id`)
);

# insert data from locations table
INSERT INTO `latest_locations` (`tow_truck_id`, `node_id`, `timestamp`)
SELECT `tow_truck_id`, `node_id`, `timestamp`
FROM `locations`
WHERE (`tow_truck_id`, `timestamp`) IN (
    SELECT `tow_truck_id`, MAX(`timestamp`)
    FROM `locations`
    GROUP BY `tow_truck_id`
);