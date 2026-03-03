"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference types="node" />
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
const Role = client_1.$Enums.Role;
async function main() {
    // Create categories first
    console.log('Creating categories...');
    const categories = [
        { name: 'Aerospace Machining', slug: 'aerospace-machining', description: 'Precision machined aerospace components and parts', count: 25 },
        { name: 'Forgings', slug: 'forgings', description: 'Forged structural and load-bearing components', count: 9 },
        { name: 'Precision Components', slug: 'precision-components', description: 'High-precision engineered components', count: 12 },
        { name: 'Toolings', slug: 'toolings', description: 'Manufacturing tools, fixtures, and dies', count: 15 },
        { name: 'Wire & Harness Products', slug: 'wire-harness-products', description: 'Electrical wiring assemblies and harnesses', count: 10 },
        { name: 'Surface Treatment & Coatings', slug: 'surface-treatment-coatings', description: 'Protective coatings and surface treatments', count: 7 },
        { name: 'Heat Treatment', slug: 'heat-treatment', description: 'Heat-treated components and materials', count: 5 },
        { name: 'Sheet Metal Components', slug: 'sheet-metal-components', description: 'Fabricated sheet metal parts and assemblies', count: 3 },
    ];
    const categoryMap = new Map();
    for (const cat of categories) {
        const category = await prisma.category.upsert({
            where: { slug: cat.slug },
            update: {
                name: cat.name,
                description: cat.description,
                productCount: cat.count,
            },
            create: {
                name: cat.name,
                slug: cat.slug,
                description: cat.description,
                productCount: cat.count,
            },
        });
        categoryMap.set(cat.name, category);
    }
    console.log('Categories created');
    const productSeeds = [
        {
            referenceCode: 'PRD-1001',
            name: 'CFM56-7B Engine Blade',
            category: 'Engine Parts',
            image: '/engine-blade.jpg',
            description: 'High-performance turbine blade for CFM56-7B engines.',
            vendor: 'AeroTech Components',
            price: '425000',
            availability: 'Available',
            warranty: '24 months',
            warrantyStatus: 'Active',
            rating: 4.8,
            status: 'available',
            warrantyExpiry: new Date('2026-04-25'),
        },
        {
            referenceCode: 'PRD-1002',
            name: 'B737 Landing Gear Assembly',
            category: 'Landing Systems',
            image: '/landing-gear.jpg',
            description: 'Complete landing gear assembly for Boeing 737 fleet.',
            vendor: 'Precision Aviation',
            price: '1250000',
            availability: 'On Request',
            warranty: '36 months',
            warrantyStatus: 'Active',
            rating: 4.9,
            status: 'limited',
            warrantyExpiry: new Date('2026-06-17'),
        },
        {
            referenceCode: 'PRD-1003',
            name: 'A320 Hydraulic Pump',
            category: 'Hydraulic Systems',
            image: '/hydraulic-pump.jpg',
            description: 'Advanced hydraulic pump system for Airbus A320.',
            vendor: 'FlightTech Solutions',
            price: '375000',
            availability: 'Pre-order',
            warranty: '18 months',
            warrantyStatus: 'Expiring',
            rating: 4.6,
            status: 'preorder',
            warrantyExpiry: new Date('2025-12-30'),
        },
        {
            referenceCode: 'PRD-1004',
            name: 'Avionics Navigation Unit',
            category: 'Avionics',
            image: '/avionics-unit.jpg',
            description: 'State-of-the-art navigation control unit.',
            vendor: 'TechAero Systems',
            price: '890000',
            availability: 'Available',
            warranty: '30 months',
            warrantyStatus: 'Active',
            rating: 4.7,
            status: 'available',
            warrantyExpiry: new Date('2026-01-10'),
        },
        {
            referenceCode: 'PRD-1005',
            name: 'APU Starter Generator',
            category: 'Engine Parts',
            image: '/engine-blade.jpg',
            description: 'Auxiliary Power Unit starter generator for wide-body aircraft.',
            vendor: 'AeroTech Components',
            price: '675000',
            availability: 'Available',
            warranty: '24 months',
            warrantyStatus: 'Active',
            rating: 4.5,
            status: 'available',
            warrantyExpiry: new Date('2026-08-15'),
        },
        {
            referenceCode: 'PRD-1006',
            name: 'A380 Brake Assembly',
            category: 'Landing Systems',
            image: '/landing-gear.jpg',
            description: 'Carbon brake assembly for Airbus A380 main landing gear.',
            vendor: 'Precision Aviation',
            price: '2850000',
            availability: 'On Request',
            warranty: '40 months',
            warrantyStatus: 'Active',
            rating: 4.9,
            status: 'limited',
            warrantyExpiry: new Date('2027-02-10'),
        },
        {
            referenceCode: 'PRD-1007',
            name: 'B787 Hydraulic Accumulator',
            category: 'Hydraulic Systems',
            image: '/hydraulic-pump.jpg',
            description: 'High-pressure hydraulic accumulator for Boeing 787 Dreamliner.',
            vendor: 'FlightTech Solutions',
            price: '185000',
            availability: 'Available',
            warranty: '20 months',
            warrantyStatus: 'Active',
            rating: 4.6,
            status: 'available',
            warrantyExpiry: new Date('2026-03-20'),
        },
        {
            referenceCode: 'PRD-1008',
            name: 'Flight Management Computer',
            category: 'Avionics',
            image: '/avionics-unit.jpg',
            description: 'Advanced FMC with latest navigation database capabilities.',
            vendor: 'TechAero Systems',
            price: '1450000',
            availability: 'Available',
            warranty: '36 months',
            warrantyStatus: 'Active',
            rating: 4.8,
            status: 'available',
            warrantyExpiry: new Date('2026-12-01'),
        },
        {
            referenceCode: 'PRD-1009',
            name: 'Rolls-Royce Trent 1000 Fan Blade',
            category: 'Engine Parts',
            image: '/engine-blade.jpg',
            description: 'Titanium fan blade for Rolls-Royce Trent 1000 engines.',
            vendor: 'AeroTech Components',
            price: '525000',
            availability: 'Pre-order',
            warranty: '30 months',
            warrantyStatus: 'Active',
            rating: 4.7,
            status: 'preorder',
            warrantyExpiry: new Date('2026-05-30'),
        },
        {
            referenceCode: 'PRD-1010',
            name: 'Nose Landing Gear Actuator',
            category: 'Landing Systems',
            image: '/landing-gear.jpg',
            description: 'Electric actuator for nose landing gear steering system.',
            vendor: 'Precision Aviation',
            price: '295000',
            availability: 'Available',
            warranty: '24 months',
            warrantyStatus: 'Active',
            rating: 4.5,
            status: 'available',
            warrantyExpiry: new Date('2026-07-15'),
        },
        {
            referenceCode: 'PRD-1011',
            name: 'Hydraulic Filter Assembly',
            category: 'Hydraulic Systems',
            image: '/hydraulic-pump.jpg',
            description: 'High-flow hydraulic filter with contamination indicator.',
            vendor: 'FlightTech Solutions',
            price: '45000',
            availability: 'Available',
            warranty: '12 months',
            warrantyStatus: 'Active',
            rating: 4.4,
            status: 'available',
            warrantyExpiry: new Date('2026-02-28'),
        },
        {
            referenceCode: 'PRD-1012',
            name: 'Weather Radar Antenna',
            category: 'Avionics',
            image: '/avionics-unit.jpg',
            description: 'X-band weather radar antenna with turbulence detection.',
            vendor: 'TechAero Systems',
            price: '785000',
            availability: 'Available',
            warranty: '28 months',
            warrantyStatus: 'Active',
            rating: 4.6,
            status: 'available',
            warrantyExpiry: new Date('2026-09-10'),
        },
        {
            referenceCode: 'PRD-1013',
            name: 'Turbine Nozzle Guide Vane',
            category: 'Engine Parts',
            image: '/engine-blade.jpg',
            description: 'High-temperature resistant NGV for turbine section.',
            vendor: 'AeroTech Components',
            price: '365000',
            availability: 'Available',
            warranty: '22 months',
            warrantyStatus: 'Active',
            rating: 4.7,
            status: 'available',
            warrantyExpiry: new Date('2026-06-30'),
        },
        {
            referenceCode: 'PRD-1014',
            name: 'Main Landing Gear Truck Beam',
            category: 'Landing Systems',
            image: '/landing-gear.jpg',
            description: 'Forged steel truck beam for wide-body aircraft MLG.',
            vendor: 'Precision Aviation',
            price: '1680000',
            availability: 'On Request',
            warranty: '48 months',
            warrantyStatus: 'Active',
            rating: 4.8,
            status: 'limited',
            warrantyExpiry: new Date('2027-04-01'),
        },
        {
            referenceCode: 'PRD-1015',
            name: 'Hydraulic Reservoir Tank',
            category: 'Hydraulic Systems',
            image: '/hydraulic-pump.jpg',
            description: 'Pressurized hydraulic fluid reservoir with level sensor.',
            vendor: 'FlightTech Solutions',
            price: '156000',
            availability: 'Available',
            warranty: '18 months',
            warrantyStatus: 'Active',
            rating: 4.5,
            status: 'available',
            warrantyExpiry: new Date('2026-04-15'),
        },
        {
            referenceCode: 'PRD-1016',
            name: 'TCAS II System',
            category: 'Avionics',
            image: '/avionics-unit.jpg',
            description: 'Traffic Collision Avoidance System with latest software.',
            vendor: 'TechAero Systems',
            price: '1250000',
            availability: 'Available',
            warranty: '36 months',
            warrantyStatus: 'Active',
            rating: 4.9,
            status: 'available',
            warrantyExpiry: new Date('2027-01-20'),
        },
        {
            referenceCode: 'PRD-1017',
            name: 'Engine Oil Filter',
            category: 'Engine Parts',
            image: '/engine-blade.jpg',
            description: 'Full-flow oil filter for jet engines with magnetic chip detector.',
            vendor: 'AeroTech Components',
            price: '28500',
            availability: 'Available',
            warranty: '12 months',
            warrantyStatus: 'Active',
            rating: 4.3,
            status: 'available',
            warrantyExpiry: new Date('2026-03-01'),
        },
        {
            referenceCode: 'PRD-1018',
            name: 'Anti-Skid Control Unit',
            category: 'Landing Systems',
            image: '/landing-gear.jpg',
            description: 'Electronic anti-skid brake control system.',
            vendor: 'Precision Aviation',
            price: '425000',
            availability: 'Available',
            warranty: '24 months',
            warrantyStatus: 'Active',
            rating: 4.6,
            status: 'available',
            warrantyExpiry: new Date('2026-08-25'),
        },
        {
            referenceCode: 'PRD-1019',
            name: 'Hydraulic Motor Assembly',
            category: 'Hydraulic Systems',
            image: '/hydraulic-pump.jpg',
            description: 'Variable displacement hydraulic motor for actuation systems.',
            vendor: 'FlightTech Solutions',
            price: '215000',
            availability: 'Available',
            warranty: '20 months',
            warrantyStatus: 'Active',
            rating: 4.5,
            status: 'available',
            warrantyExpiry: new Date('2026-05-10'),
        },
        {
            referenceCode: 'PRD-1020',
            name: 'VHF Communication Radio',
            category: 'Avionics',
            image: '/avionics-unit.jpg',
            description: '8.33kHz capable VHF comm radio with LCD display.',
            vendor: 'TechAero Systems',
            price: '385000',
            availability: 'Available',
            warranty: '24 months',
            warrantyStatus: 'Active',
            rating: 4.7,
            status: 'available',
            warrantyExpiry: new Date('2026-10-05'),
        },
    ];
    const vendorSeeds = [
        {
            name: 'AeroParts Inc.',
            location: 'Mumbai, India',
            rating: 4.8,
            specialty: 'Engine Components',
            image: '/placeholder.svg',
            verificationStatus: 'Verified',
            isActive: true,
            certifications: ['DGCA 145 Approval', 'EASA Part-21 POA'],
        },
        {
            name: 'Global Avionics',
            location: 'Hyderabad, India',
            rating: 4.9,
            specialty: 'Avionics Systems',
            image: '/placeholder.svg',
            verificationStatus: 'Verified',
            isActive: true,
            certifications: ['DGCA CAR 145', 'AS9100 Rev D'],
        },
        {
            name: 'Precision Hydraulics',
            location: 'Bengaluru, India',
            rating: 4.7,
            specialty: 'Hydraulic Systems',
            image: '/placeholder.svg',
            verificationStatus: 'Pending',
            isActive: true,
            certifications: ['NABL Accredited Lab'],
        },
    ];
    // Map old categories to new categories
    const categoryMapping = {
        'Engine Parts': 'Aerospace Machining',
        'Landing Systems': 'Forgings',
        'Hydraulic Systems': 'Precision Components',
        'Avionics': 'Wire & Harness Products',
    };
    const products = await Promise.all(productSeeds.map((seed) => {
        const newCategoryName = categoryMapping[seed.category] || 'Aerospace Machining';
        const categoryId = categoryMap.get(newCategoryName)?.id;
        return prisma.product.upsert({
            where: { referenceCode: seed.referenceCode },
            update: {
                name: seed.name,
                category: seed.category,
                categoryId: categoryId,
                image: seed.image,
                description: seed.description,
                vendor: seed.vendor,
                price: seed.price,
                availability: seed.availability,
                warranty: seed.warranty,
                warrantyStatus: seed.warrantyStatus,
                rating: seed.rating,
                status: seed.status,
                warrantyExpiry: seed.warrantyExpiry,
            },
            create: {
                ...seed,
                categoryId: categoryId,
            },
        });
    }));
    // Add additional products for each category to meet target counts
    const additionalProducts = [
        // Aerospace Machining (need 25 total, add more)
        ...Array.from({ length: 15 }, (_, i) => ({
            referenceCode: `PRD-AM-${1021 + i}`,
            name: `Aerospace Machined Component ${i + 1}`,
            category: 'Aerospace Machining',
            categoryId: categoryMap.get('Aerospace Machining')?.id,
            image: '/engine-blade.jpg',
            description: 'Precision machined aerospace component with tight tolerances',
            vendor: 'AeroTech Components',
            price: `${150000 + i * 10000}`,
            availability: i % 3 === 0 ? 'Available' : 'On Request',
            warranty: '24 months',
            warrantyStatus: 'Active',
            rating: 4.5 + (i % 5) * 0.1,
            status: 'available',
            warrantyExpiry: new Date('2026-12-31'),
        })),
        // Forgings (need 9 total)
        ...Array.from({ length: 4 }, (_, i) => ({
            referenceCode: `PRD-FRG-${1050 + i}`,
            name: `Forged Structural Component ${i + 1}`,
            category: 'Forgings',
            categoryId: categoryMap.get('Forgings')?.id,
            image: '/landing-gear.jpg',
            description: 'High-strength forged component for structural applications',
            vendor: 'Precision Aviation',
            price: `${500000 + i * 50000}`,
            availability: 'On Request',
            warranty: '36 months',
            warrantyStatus: 'Active',
            rating: 4.7 + (i % 3) * 0.1,
            status: 'limited',
            warrantyExpiry: new Date('2027-06-30'),
        })),
        // Precision Components (need 12 total)
        ...Array.from({ length: 7 }, (_, i) => ({
            referenceCode: `PRD-PC-${1060 + i}`,
            name: `Precision Component Assembly ${i + 1}`,
            category: 'Precision Components',
            categoryId: categoryMap.get('Precision Components')?.id,
            image: '/hydraulic-pump.jpg',
            description: 'High-precision component with micron-level accuracy',
            vendor: 'FlightTech Solutions',
            price: `${200000 + i * 15000}`,
            availability: 'Available',
            warranty: '18 months',
            warrantyStatus: 'Active',
            rating: 4.6,
            status: 'available',
            warrantyExpiry: new Date('2026-09-30'),
        })),
        // Toolings (15 items)
        ...Array.from({ length: 15 }, (_, i) => ({
            referenceCode: `PRD-TL-${1070 + i}`,
            name: `Manufacturing Tooling ${i + 1}`,
            category: 'Toolings',
            categoryId: categoryMap.get('Toolings')?.id,
            image: '/engine-blade.jpg',
            description: 'Precision tooling for aerospace manufacturing',
            vendor: 'AeroTech Components',
            price: `${75000 + i * 5000}`,
            availability: 'Available',
            warranty: '12 months',
            warrantyStatus: 'Active',
            rating: 4.4 + (i % 6) * 0.1,
            status: 'available',
            warrantyExpiry: new Date('2026-08-31'),
        })),
        // Wire & Harness Products (need 10 total)
        ...Array.from({ length: 5 }, (_, i) => ({
            referenceCode: `PRD-WH-${1090 + i}`,
            name: `Wire Harness Assembly ${i + 1}`,
            category: 'Wire & Harness Products',
            categoryId: categoryMap.get('Wire & Harness Products')?.id,
            image: '/avionics-unit.jpg',
            description: 'Custom wire harness for aircraft electrical systems',
            vendor: 'TechAero Systems',
            price: `${95000 + i * 8000}`,
            availability: 'Available',
            warranty: '24 months',
            warrantyStatus: 'Active',
            rating: 4.5,
            status: 'available',
            warrantyExpiry: new Date('2026-11-30'),
        })),
        // Surface Treatment & Coatings (7 items)
        ...Array.from({ length: 7 }, (_, i) => ({
            referenceCode: `PRD-ST-${1100 + i}`,
            name: `Surface Coated Component ${i + 1}`,
            category: 'Surface Treatment & Coatings',
            categoryId: categoryMap.get('Surface Treatment & Coatings')?.id,
            image: '/engine-blade.jpg',
            description: 'Component with specialized surface treatment and protective coating',
            vendor: 'AeroTech Components',
            price: `${125000 + i * 10000}`,
            availability: 'Available',
            warranty: '30 months',
            warrantyStatus: 'Active',
            rating: 4.6,
            status: 'available',
            warrantyExpiry: new Date('2027-01-31'),
        })),
        // Heat Treatment (5 items)
        ...Array.from({ length: 5 }, (_, i) => ({
            referenceCode: `PRD-HT-${1110 + i}`,
            name: `Heat Treated Component ${i + 1}`,
            category: 'Heat Treatment',
            categoryId: categoryMap.get('Heat Treatment')?.id,
            image: '/landing-gear.jpg',
            description: 'Hardened and tempered component with enhanced strength',
            vendor: 'Precision Aviation',
            price: `${180000 + i * 12000}`,
            availability: 'Available',
            warranty: '24 months',
            warrantyStatus: 'Active',
            rating: 4.7,
            status: 'available',
            warrantyExpiry: new Date('2026-10-31'),
        })),
        // Sheet Metal Components (3 items)
        ...Array.from({ length: 3 }, (_, i) => ({
            referenceCode: `PRD-SM-${1120 + i}`,
            name: `Sheet Metal Assembly ${i + 1}`,
            category: 'Sheet Metal Components',
            categoryId: categoryMap.get('Sheet Metal Components')?.id,
            image: '/landing-gear.jpg',
            description: 'Fabricated sheet metal component for aircraft structures',
            vendor: 'Precision Aviation',
            price: `${85000 + i * 7000}`,
            availability: 'Available',
            warranty: '18 months',
            warrantyStatus: 'Active',
            rating: 4.5,
            status: 'available',
            warrantyExpiry: new Date('2026-07-31'),
        })),
    ];
    await Promise.all(additionalProducts.map((product) => prisma.product.upsert({
        where: { referenceCode: product.referenceCode },
        update: product,
        create: product,
    })));
    const vendors = await Promise.all(vendorSeeds.map((seed) => prisma.vendor.upsert({
        where: { name: seed.name },
        update: {
            location: seed.location,
            rating: seed.rating,
            specialty: seed.specialty,
            image: seed.image,
            verificationStatus: seed.verificationStatus,
            isActive: seed.isActive,
            certifications: seed.certifications ?? [],
        },
        create: seed,
    })));
    const productMap = new Map(products.map((product) => [product.referenceCode, product]));
    const vendorMap = new Map(vendors.map((vendor) => [vendor.name, vendor]));
    const warrantySeeds = [
        {
            referenceCode: 'PRD-1001',
            vendor: 'AeroParts Inc.',
            tailNumber: 'VT-AXA',
            expiryDate: new Date('2026-04-25'),
        },
        {
            referenceCode: 'PRD-1003',
            vendor: 'Precision Hydraulics',
            tailNumber: 'VT-BHY',
            expiryDate: new Date('2025-12-30'),
        },
    ];
    for (const record of warrantySeeds) {
        const product = productMap.get(record.referenceCode);
        if (!product)
            continue;
        const vendor = vendorMap.get(record.vendor);
        const existing = await prisma.warrantyRecord.findFirst({
            where: { productId: product.id, tailNumber: record.tailNumber },
        });
        if (existing) {
            await prisma.warrantyRecord.update({
                where: { id: existing.id },
                data: { vendorId: vendor?.id, expiryDate: record.expiryDate },
            });
        }
        else {
            await prisma.warrantyRecord.create({
                data: {
                    productId: product.id,
                    vendorId: vendor?.id,
                    tailNumber: record.tailNumber,
                    expiryDate: record.expiryDate,
                },
            });
        }
    }
    const mroSeeds = [
        {
            tailNumber: 'VT-AXA',
            provider: 'Elite MRO Services',
            serviceType: 'CFM56 hot section overhaul',
            status: 'Scheduled',
            estimatedTatDays: 55,
            startDate: new Date('2026-02-15'),
        },
        {
            tailNumber: 'VT-JQD',
            provider: 'Skyline Avionics',
            serviceType: 'Flight deck upgrade',
            status: 'In Progress',
            estimatedTatDays: 18,
            startDate: new Date('2026-02-01'),
        },
    ];
    for (const order of mroSeeds) {
        const existing = await prisma.mroOrder.findFirst({
            where: { tailNumber: order.tailNumber, provider: order.provider, serviceType: order.serviceType },
        });
        if (existing) {
            await prisma.mroOrder.update({ where: { id: existing.id }, data: order });
        }
        else {
            await prisma.mroOrder.create({ data: order });
        }
    }
    const complaintSeeds = [
        {
            referenceCode: 'PRD-1002',
            vendor: 'AeroParts Inc.',
            subject: 'Landing gear actuator vibration',
            description: 'Detected vibration during post-installation taxi checks.',
            status: 'In Review',
        },
    ];
    for (const complaint of complaintSeeds) {
        const product = productMap.get(complaint.referenceCode);
        if (!product)
            continue;
        const vendor = vendorMap.get(complaint.vendor);
        const existing = await prisma.complaint.findFirst({
            where: { productId: product.id, subject: complaint.subject },
        });
        if (existing) {
            await prisma.complaint.update({
                where: { id: existing.id },
                data: { description: complaint.description, status: complaint.status, vendorId: vendor?.id },
            });
        }
        else {
            await prisma.complaint.create({
                data: {
                    productId: product.id,
                    vendorId: vendor?.id,
                    subject: complaint.subject,
                    description: complaint.description,
                    status: complaint.status,
                },
            });
        }
    }
    // Ensure admin and sample vendor users exist
    const adminPasswordHash = await bcryptjs_1.default.hash('admin@skyway1', 10);
    await prisma.user.upsert({
        where: { email: 'admin@skyway.aero' },
        update: { role: Role.ADMIN, isActive: true },
        create: {
            name: 'Skyway Admin',
            email: 'admin@skyway.aero',
            passwordHash: adminPasswordHash,
            role: Role.ADMIN,
            isActive: true,
        },
    });
    const vendorPasswordHash = await bcryptjs_1.default.hash('password', 10);
    const sampleVendor = vendorMap.get('AeroParts Inc.');
    await prisma.user.upsert({
        where: { email: 'vendor@example.com' },
        update: {
            role: Role.VENDOR,
            isActive: true,
            vendorId: sampleVendor?.id,
        },
        create: {
            name: 'Vendor User',
            email: 'vendor@example.com',
            passwordHash: vendorPasswordHash,
            role: Role.VENDOR,
            isActive: true,
            vendorId: sampleVendor?.id,
        },
    });
    const buyerPasswordHash = await bcryptjs_1.default.hash('buyerpass', 10);
    await prisma.user.upsert({
        where: { email: 'buyer@example.com' },
        update: { role: Role.BUYER, isActive: true },
        create: {
            name: 'Buyer User',
            email: 'buyer@example.com',
            passwordHash: buyerPasswordHash,
            role: Role.BUYER,
            isActive: true,
        },
    });
    console.log('Seed data created');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
