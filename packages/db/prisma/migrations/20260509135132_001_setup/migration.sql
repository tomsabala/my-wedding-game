-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('DRAFT', 'LIVE');

-- CreateEnum
CREATE TYPE "PassingCardType" AS ENUM ('DID_YOU_KNOW', 'PHOTO', 'VIDEO');

-- CreateTable
CREATE TABLE "games" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "couple_names" TEXT NOT NULL,
    "wedding_date" DATE NOT NULL,
    "tagline" TEXT,
    "status" "GameStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correct_index" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passing_cards" (
    "id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "type" "PassingCardType" NOT NULL,
    "content" TEXT NOT NULL,
    "after_question_position" INTEGER,

    CONSTRAINT "passing_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_answers" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "selected_index" INTEGER NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "time_taken_ms" INTEGER NOT NULL,

    CONSTRAINT "player_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "games_slug_key" ON "games"("slug");

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passing_cards" ADD CONSTRAINT "passing_cards_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_answers" ADD CONSTRAINT "player_answers_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_answers" ADD CONSTRAINT "player_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
