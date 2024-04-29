CREATE TABLE IF NOT EXISTS tournament_statistics (
    id INTEGER PRIMARY KEY,
    team_name TEXT NOT NULL,
    team_tag TEXT NOT NULL,
    team_points INTEGER NOT NULL
);