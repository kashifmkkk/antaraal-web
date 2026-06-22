-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: May 11, 2026 at 12:54 PM
-- Server version: 10.6.24-MariaDB-cll-lve
-- PHP Version: 8.4.20

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `antaraal_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_settings`
--

CREATE TABLE `admin_settings` (
  `id` int(11) NOT NULL,
  `notification_email` varchar(255) NOT NULL DEFAULT 'ops@skyway.aero',
  `rfq_auto_assign` tinyint(1) NOT NULL DEFAULT 0,
  `daily_digest` tinyint(1) NOT NULL DEFAULT 0,
  `compliance_notes` longtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin_settings`
--

INSERT INTO `admin_settings` (`id`, `notification_email`, `rfq_auto_assign`, `daily_digest`, `compliance_notes`) VALUES
(1, 'ops@skyway.aero', 0, 0, '');

-- --------------------------------------------------------

--
-- Table structure for table `cart`
--

CREATE TABLE `cart` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cart`
--

INSERT INTO `cart` (`id`, `user_id`, `product_id`, `quantity`, `created_at`, `updated_at`) VALUES
(1, 2, 1, 1, '2026-04-25 08:02:44', '2026-04-25 08:02:44');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `product_count` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `product_count`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'engine parts', 'engine-parts', 'xdcvx', 0, 1, '2026-04-25 08:17:06', '2026-05-11 10:55:29'),
(2, 'Overhaul services', 'overhaul-services', '', 0, 1, '2026-05-11 10:55:20', '2026-05-11 10:55:20');

-- --------------------------------------------------------

--
-- Table structure for table `complaints`
--

CREATE TABLE `complaints` (
  `id` int(11) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'New',
  `product_id` int(11) NOT NULL,
  `vendor_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `mro_orders`
--

CREATE TABLE `mro_orders` (
  `id` int(11) NOT NULL,
  `tail_number` varchar(100) NOT NULL,
  `provider` varchar(255) NOT NULL,
  `service_type` varchar(255) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Scheduled',
  `estimated_tat_days` int(11) NOT NULL,
  `start_date` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `body` text DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `vendor_id` int(11) DEFAULT NULL,
  `product_id` int(11) DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `title`, `body`, `user_id`, `vendor_id`, `product_id`, `is_read`, `created_at`) VALUES
(1, 'sdfv sdcv', 'dzvcx', 1, NULL, NULL, 0, '2026-04-25 08:21:31'),
(2, 'sdfv sdcv', 'dzvcx', 2, NULL, NULL, 0, '2026-04-25 08:21:31'),
(3, 'sdfv sdcv', 'dzvcx', 3, NULL, NULL, 0, '2026-04-25 08:21:31'),
(4, 'sdfv sdcv', 'dzvcx', 4, NULL, NULL, 0, '2026-04-25 08:21:31'),
(5, 'sdfv sdcv', 'dzvcx', 6, NULL, NULL, 0, '2026-04-25 08:21:31'),
(6, 'xfgxx', 'dfxfv', 6, NULL, NULL, 0, '2026-04-25 08:22:04'),
(7, 'xfgxx', 'dfxfv', 3, NULL, NULL, 0, '2026-04-25 08:22:04'),
(8, 'new produt lauch', 'welcome new complvbia jhbis', 1, NULL, NULL, 0, '2026-05-10 08:45:47'),
(9, 'new produt lauch', 'welcome new complvbia jhbis', 2, NULL, NULL, 0, '2026-05-10 08:45:47'),
(10, 'new produt lauch', 'welcome new complvbia jhbis', 3, NULL, NULL, 0, '2026-05-10 08:45:47'),
(11, 'new produt lauch', 'welcome new complvbia jhbis', 4, NULL, NULL, 0, '2026-05-10 08:45:47'),
(12, 'new produt lauch', 'welcome new complvbia jhbis', 6, NULL, NULL, 0, '2026-05-10 08:45:47'),
(13, 'new produt lauch', 'welcome new complvbia jhbis', 8, NULL, NULL, 0, '2026-05-10 08:45:47'),
(14, 'new produt lauch', 'welcome new complvbia jhbis', 7, NULL, NULL, 0, '2026-05-10 08:45:47');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `order_number` varchar(255) NOT NULL,
  `total_amount` decimal(12,2) NOT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'INR',
  `status` varchar(50) NOT NULL DEFAULT 'Pending',
  `shipping_address` text DEFAULT NULL,
  `billing_address` text DEFAULT NULL,
  `payment_method` varchar(100) DEFAULT NULL,
  `payment_status` varchar(50) NOT NULL DEFAULT 'Pending',
  `tracking_number` varchar(255) DEFAULT NULL,
  `shipping_carrier` varchar(255) DEFAULT NULL,
  `shipped_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `user_id`, `order_number`, `total_amount`, `currency`, `status`, `shipping_address`, `billing_address`, `payment_method`, `payment_status`, `tracking_number`, `shipping_carrier`, `shipped_at`, `delivered_at`, `created_at`, `updated_at`) VALUES
(1, 7, 'SKY-69EDE5A85F082', 0.00, 'USD', 'Delivered', '\"fghfjyfy\"', '\"cjhfjkgui\"', 'Credit Card', 'Paid', NULL, NULL, '2026-04-26 03:15:30', '2026-04-26 11:07:35', '2026-04-26 03:15:04', '2026-04-26 11:07:35'),
(2, 6, 'SKY-69EEF61DBE6FC', 8078.00, 'USD', 'Delivered', '\"jkgb\"', '\"jhvm\"', 'Credit Card', 'Paid', NULL, NULL, NULL, '2026-04-26 22:47:11', '2026-04-26 22:37:33', '2026-04-26 22:47:11'),
(3, 8, 'SKY-6A00A7A1B01E3', 2000.00, 'USD', 'Delivered', '\"gghcasc\"', '\"boiuhciajhopc\"', 'Credit Card', 'Paid', NULL, NULL, '2026-05-10 08:44:46', '2026-05-11 10:55:56', '2026-05-10 08:43:29', '2026-05-11 10:55:56'),
(4, 7, 'SKY-6A02187A324AB', 0.00, 'USD', 'Shipped', '\"xyz\"', '\"xyz\"', 'Credit Card', 'Paid', NULL, NULL, '2026-05-11 10:57:33', NULL, '2026-05-11 10:57:14', '2026-05-11 10:57:33'),
(5, 7, 'SKY-6A021B5FA8AD5', 0.00, 'USD', 'Pending', '\"sd\"', '\"sdf\"', 'Credit Card', 'Paid', NULL, NULL, NULL, NULL, '2026-05-11 11:09:35', '2026-05-11 11:09:35');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `price`, `created_at`) VALUES
(1, 1, 3, 1, 0.00, '2026-04-26 03:15:04'),
(2, 2, 1, 4, 2000.00, '2026-04-26 22:37:33'),
(4, 3, 1, 1, 2000.00, '2026-05-10 08:43:29'),
(5, 4, 3, 1, 0.00, '2026-05-11 10:57:14'),
(6, 5, 3, 1, 0.00, '2026-05-11 11:09:35');

-- --------------------------------------------------------

--
-- Table structure for table `pricing_ranges`
--

CREATE TABLE `pricing_ranges` (
  `id` int(11) NOT NULL,
  `role` varchar(16) NOT NULL,
  `label` varchar(128) NOT NULL,
  `min_value` varchar(64) NOT NULL,
  `max_value` varchar(64) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(255) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `image` varchar(512) NOT NULL,
  `photos` longtext NOT NULL,
  `description` longtext DEFAULT NULL,
  `reference_code` varchar(255) DEFAULT NULL,
  `vendor` varchar(255) DEFAULT NULL,
  `price` varchar(100) DEFAULT NULL,
  `availability` varchar(100) NOT NULL DEFAULT 'On Request',
  `warranty` varchar(255) DEFAULT NULL,
  `warranty_status` varchar(50) NOT NULL DEFAULT 'Active',
  `rating` decimal(4,2) DEFAULT NULL,
  `review_count` int(11) NOT NULL DEFAULT 0,
  `status` varchar(50) NOT NULL DEFAULT 'available',
  `warranty_expiry` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `category`, `category_id`, `image`, `photos`, `description`, `reference_code`, `vendor`, `price`, `availability`, `warranty`, `warranty_status`, `rating`, `review_count`, `status`, `warranty_expiry`, `created_at`, `updated_at`) VALUES
(1, 'test', 'Engine Parts', NULL, '/placeholder.svg', '[]', NULL, '1', 'AeroTech Components', '2000', 'On Request', 'Standard', 'Active', NULL, 0, 'available', NULL, '2026-04-25 08:02:31', '2026-05-10 08:46:24'),
(3, 'Fan', 'Parts', NULL, '/placeholder.svg', '[]', '', '', 'Antaraal', NULL, 'Available', NULL, 'Active', NULL, 0, 'pending', NULL, '2026-04-26 03:11:32', '2026-04-26 22:42:51');

-- --------------------------------------------------------

--
-- Table structure for table `quotes`
--

CREATE TABLE `quotes` (
  `id` int(11) NOT NULL,
  `rfq_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `vendor_id` int(11) DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'INR',
  `status` varchar(50) NOT NULL DEFAULT 'Draft',
  `comments` text DEFAULT NULL,
  `issued_at` datetime NOT NULL DEFAULT current_timestamp(),
  `valid_until` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `user_name` varchar(255) NOT NULL,
  `rating` int(11) NOT NULL,
  `comment` text DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Pending',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`id`, `product_id`, `user_id`, `user_name`, `rating`, `comment`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 8, 'kashif', 5, 'good seervice', 'Approved', '2026-05-10 08:56:08', '2026-05-10 08:56:49'),
(2, 3, 8, 'kashif', 5, 'bjhsbclhilan', 'Approved', '2026-05-10 08:57:48', '2026-05-10 08:59:18');

-- --------------------------------------------------------

--
-- Table structure for table `rfqs`
--

CREATE TABLE `rfqs` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `company` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(100) DEFAULT NULL,
  `part_number` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `file_url` varchar(512) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'New',
  `assigned_vendor_id` int(11) DEFAULT NULL,
  `internal_notes` text DEFAULT NULL,
  `buyer_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'BUYER',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_active_at` datetime NOT NULL DEFAULT current_timestamp(),
  `vendor_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `is_active`, `last_active_at`, `vendor_id`, `created_at`, `updated_at`) VALUES
(1, 'Smoke Test', 'smoketest_1892015192@antaraalspace.com', '$2y$10$wfMGBvGB4m0b2Tpx63kOu.ArQSOWd4qL.ew1yf.LW4QeoEsGz1lM.', 'BUYER', 1, '2026-04-25 03:29:58', NULL, '2026-04-25 03:29:58', '2026-04-25 03:29:58'),
(2, 'kashifxmk', 'kashifxmk@gmail.com', '$2y$10$hmGaDECqfpZPTB3TrGLWCOd.R65cYrkxcODM7a5zwpLUBdqy4MBuu', 'BUYER', 1, '2026-04-25 03:41:04', NULL, '2026-04-25 03:41:04', '2026-04-25 03:41:04'),
(3, 'admin', 'admin@antaraal.com', '$2y$10$vEyQOL8BOKtKKuQuJoaC2.4HBYIONM6t9N0czwFFJfwpbjcRn.LjW', 'ADMIN', 1, '2026-04-25 07:53:42', NULL, '2026-04-25 07:53:42', '2026-04-25 07:54:16'),
(4, 'sharyubhasme', 'sharyubhasme@gmail.com', '$2y$10$04U13o4ccMjOOSny3xa9zO4nVi22FHSFSDCYWaAz8w6hof9IxbLd2', 'BUYER', 1, '2026-04-25 08:14:24', NULL, '2026-04-25 08:14:24', '2026-04-25 08:14:24'),
(6, 'duskflames11', 'duskflames11@gmail.com', '$2y$10$9Y1o8S/sX7gg8hhN3lK.sOunQwORgLzVTsK9xvOd6iCiYtmXIwbru', 'BUYER', 1, '2026-04-25 08:19:38', NULL, '2026-04-25 08:19:38', '2026-04-25 08:19:38'),
(7, 'Antaraal', 'ops@antaraal.com', '$2y$10$SbJkLr3.x7JMw2Y9faqM5.RWxFgWzxw62Nbt5PATdc2/WQdA6rlea', 'VENDOR', 1, '2026-04-26 03:10:54', 1, '2026-04-26 03:10:54', '2026-04-26 03:10:54'),
(8, 'kashif', 'kashif@gmail.com', '$2y$10$NWGrYQ9EevOd4rxeyY1tA.efMk8J3fHEA0MrZr1yTRtFhJJNvbgjW', 'BUYER', 1, '2026-05-10 08:42:44', NULL, '2026-05-10 08:42:44', '2026-05-11 12:36:31');

-- --------------------------------------------------------

--
-- Table structure for table `vendors`
--

CREATE TABLE `vendors` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `rating` decimal(4,2) DEFAULT NULL,
  `specialty` varchar(255) DEFAULT NULL,
  `image` varchar(512) DEFAULT NULL,
  `verification_status` varchar(50) NOT NULL DEFAULT 'Pending',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `certifications` longtext NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `vendors`
--

INSERT INTO `vendors` (`id`, `name`, `location`, `rating`, `specialty`, `image`, `verification_status`, `is_active`, `certifications`, `created_at`, `updated_at`) VALUES
(1, 'Antaraal', 'Bengaluru', NULL, 'Aviation', NULL, 'Verified', 1, '[\"AS@100\"]', '2026-04-26 03:10:54', '2026-04-26 03:13:44');

-- --------------------------------------------------------

--
-- Table structure for table `warranty_claims`
--

CREATE TABLE `warranty_claims` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `record_id` int(11) DEFAULT NULL,
  `subject` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Pending',
  `response` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `warranty_records`
--

CREATE TABLE `warranty_records` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `vendor_id` int(11) DEFAULT NULL,
  `tail_number` varchar(100) DEFAULT NULL,
  `expiry_date` datetime NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_settings`
--
ALTER TABLE `admin_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `cart`
--
ALTER TABLE `cart`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_cart_user_product` (`user_id`,`product_id`),
  ADD KEY `fk_cart_product` (`product_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `complaints`
--
ALTER TABLE `complaints`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_complaints_product` (`product_id`),
  ADD KEY `fk_complaints_vendor` (`vendor_id`);

--
-- Indexes for table `mro_orders`
--
ALTER TABLE `mro_orders`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_notifications_user` (`user_id`),
  ADD KEY `fk_notifications_vendor` (`vendor_id`),
  ADD KEY `fk_notifications_product` (`product_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_number` (`order_number`),
  ADD KEY `fk_orders_user` (`user_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_order_items_order` (`order_id`),
  ADD KEY `fk_order_items_product` (`product_id`);

--
-- Indexes for table `pricing_ranges`
--
ALTER TABLE `pricing_ranges`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `reference_code` (`reference_code`),
  ADD KEY `fk_products_category` (`category_id`);

--
-- Indexes for table `quotes`
--
ALTER TABLE `quotes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_quotes_rfq` (`rfq_id`),
  ADD KEY `fk_quotes_user` (`user_id`),
  ADD KEY `fk_quotes_vendor` (`vendor_id`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_reviews_product_id` (`product_id`),
  ADD KEY `idx_reviews_status` (`status`),
  ADD KEY `fk_reviews_user` (`user_id`);

--
-- Indexes for table `rfqs`
--
ALTER TABLE `rfqs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_rfqs_vendor` (`assigned_vendor_id`),
  ADD KEY `fk_rfqs_buyer` (`buyer_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `fk_users_vendor` (`vendor_id`);

--
-- Indexes for table `vendors`
--
ALTER TABLE `vendors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `warranty_claims`
--
ALTER TABLE `warranty_claims`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_warranty_claims_user` (`user_id`),
  ADD KEY `fk_warranty_claims_product` (`product_id`),
  ADD KEY `fk_warranty_claims_record` (`record_id`);

--
-- Indexes for table `warranty_records`
--
ALTER TABLE `warranty_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_warranty_records_product` (`product_id`),
  ADD KEY `fk_warranty_records_vendor` (`vendor_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cart`
--
ALTER TABLE `cart`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `complaints`
--
ALTER TABLE `complaints`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `mro_orders`
--
ALTER TABLE `mro_orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `pricing_ranges`
--
ALTER TABLE `pricing_ranges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `quotes`
--
ALTER TABLE `quotes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `rfqs`
--
ALTER TABLE `rfqs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `vendors`
--
ALTER TABLE `vendors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `warranty_claims`
--
ALTER TABLE `warranty_claims`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `warranty_records`
--
ALTER TABLE `warranty_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cart`
--
ALTER TABLE `cart`
  ADD CONSTRAINT `fk_cart_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cart_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `complaints`
--
ALTER TABLE `complaints`
  ADD CONSTRAINT `fk_complaints_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_complaints_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_notifications_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `quotes`
--
ALTER TABLE `quotes`
  ADD CONSTRAINT `fk_quotes_rfq` FOREIGN KEY (`rfq_id`) REFERENCES `rfqs` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_quotes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_quotes_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `fk_reviews_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `rfqs`
--
ALTER TABLE `rfqs`
  ADD CONSTRAINT `fk_rfqs_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_rfqs_vendor` FOREIGN KEY (`assigned_vendor_id`) REFERENCES `vendors` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `warranty_claims`
--
ALTER TABLE `warranty_claims`
  ADD CONSTRAINT `fk_warranty_claims_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_warranty_claims_record` FOREIGN KEY (`record_id`) REFERENCES `warranty_records` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_warranty_claims_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `warranty_records`
--
ALTER TABLE `warranty_records`
  ADD CONSTRAINT `fk_warranty_records_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_warranty_records_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
