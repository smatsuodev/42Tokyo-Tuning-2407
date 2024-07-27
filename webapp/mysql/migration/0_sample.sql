-- このファイルに記述されたSQLコマンドが、マイグレーション時に実行されます。
ALTER TABLE `users` ADD INDEX username_idx(`username`);
ALTER TABLE `dispatchers` ADD INDEX user_id_idx(`user_id`);
ALTER TABLE `nodes` ADD INDEX area_id_idx(`area_id`);
ALTER TABLE orders ADD INDEX status_idx(status, order_time);