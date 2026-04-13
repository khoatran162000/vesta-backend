// FILE: prisma/seed-blog.ts — Hàm seed bài viết blog có nội dung phong phú
// Gọi hàm này từ seed.ts chính: await seedBlogPosts(prisma);

import { PrismaClient } from "@prisma/client";
import { SAMPLE_POSTS } from "./seed-posts";

export async function seedBlogPosts(prisma: PrismaClient) {
  // Tìm user có role MKT hoặc ADMIN làm author
  const author = await prisma.user.findFirst({
    where: { role: { in: ["CONTENT_CREATOR", "ADMIN"] }, isActive: true },
  });

  if (!author) {
    console.log("⚠ Không tìm thấy user MKT/ADMIN để làm author. Bỏ qua seed blog.");
    return;
  }

  for (const post of SAMPLE_POSTS) {
    const existing = await prisma.post.findFirst({
      where: { slug: post.slug },
    });

    if (existing) {
      // Update nội dung nếu bài đã tồn tại
      await prisma.post.update({
        where: { id: existing.id },
        data: {
          title: post.title,
          content: post.content,
          thumbnailUrl: post.thumbnailUrl || null,
          status: "PUBLISHED",
        },
      });
      console.log(`✅ Cập nhật: ${post.title}`);
    } else {
      await prisma.post.create({
        data: {
          title: post.title,
          slug: post.slug,
          content: post.content,
          thumbnailUrl: post.thumbnailUrl || null,
          status: "PUBLISHED",
          authorId: author.id,
        },
      });
      console.log(`✅ Tạo mới: ${post.title}`);
    }
  }

  console.log(`\n🎉 Seed blog hoàn tất — ${SAMPLE_POSTS.length} bài viết`);
}