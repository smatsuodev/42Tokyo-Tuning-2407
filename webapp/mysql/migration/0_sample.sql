-- このファイルに記述されたSQLコマンドが、マイグレーション時に実行されます。
ALTER TABLE `users` ADD INDEX username_idx(`username`);
ALTER TABLE `dispatchers` ADD INDEX user_id_idx(`user_id`);