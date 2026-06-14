-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Profile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `sex` ENUM('male', 'female', 'other', 'prefer_not_to_say') NOT NULL,
    `age` INTEGER NOT NULL,
    `heightCm` DOUBLE NOT NULL,
    `currentWeightKg` DOUBLE NOT NULL,
    `targetWeightKg` DOUBLE NULL,
    `activityLevel` ENUM('sedentary', 'light', 'moderate', 'active', 'very_active') NOT NULL,
    `goalType` ENUM('lose_weight', 'maintain_weight', 'gain_weight') NOT NULL,
    `weeklyTargetKg` DOUBLE NULL,
    `calculatedTdee` INTEGER NULL,
    `dailyCalorieTarget` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Profile_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Meal` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `eatenAt` DATETIME(3) NOT NULL,
    `source` ENUM('ai_image', 'manual') NOT NULL DEFAULT 'ai_image',
    `calories` INTEGER NOT NULL,
    `proteinG` DOUBLE NULL,
    `carbsG` DOUBLE NULL,
    `fatG` DOUBLE NULL,
    `portionDescription` VARCHAR(191) NULL,
    `userNotes` VARCHAR(191) NULL,
    `aiConfidence` DOUBLE NULL,
    `aiAssumptions` JSON NULL,
    `imageStored` BOOLEAN NOT NULL DEFAULT false,
    `imageUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Meal_userId_eatenAt_idx`(`userId`, `eatenAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiFeedback` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `periodStart` DATETIME(3) NOT NULL,
    `periodEnd` DATETIME(3) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `summary` TEXT NOT NULL,
    `jsonPayload` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AiFeedback_userId_periodStart_periodEnd_idx`(`userId`, `periodStart`, `periodEnd`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Profile` ADD CONSTRAINT `Profile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Meal` ADD CONSTRAINT `Meal_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiFeedback` ADD CONSTRAINT `AiFeedback_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

