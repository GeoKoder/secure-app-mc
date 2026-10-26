const { z, toLowerCase } = require("zod");

const registerSchema = z.object({
    email: z
        .string()
        .email("Invalid email address")
        .max(255, "Email must be less than 255 characters")
        .transform((email) => email.toLowerCase()),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password must be less tham 128 characters")
        .transform((email) => email.toLowerCase()),
    name: z
        .string()
        .min(2, "Name must be at least characters")
        .max(100, "Name must be less than 100 characters")
        .trim(),
});

const loginSchema = z.object({
    email: z.string().email("Invalid email address").transform((e) => e.toLowerCase()),
    password: z.string().min(1, "Password is required"),
});

const noteSchema = z.object({
    title: z
        .string()
        .min(1, "Title is required")
        .max(200, "Title must be less than 200 characters")
        .trim(),
    content: z  
        .string()
        .min(1, "Content is required")
        .max(10000, "Content must be less than 10,000 characters"),
    category: z
        .string()
        .max(50, "Category must be less than 50 characters")
        .optional()
        .default("General"),
    isPinned: z.boolean().optional().default(false),
});

module.exports = { registerSchema, loginSchema, noteSchema }