-- Migration: Add spotify_url column to photos and albums tables
-- Version:   004
-- Date:      2026-08-19

ALTER TABLE photos ADD COLUMN spotify_url TEXT;
ALTER TABLE albums ADD COLUMN spotify_url TEXT;
