// FILE: prisma/seed-posts.ts — Nội dung bài viết mẫu phong phú
// Import và gọi function này trong seed.ts chính

/**
 * Tạo nội dung HTML cho bài viết IELTS Reading Guide
 * Sử dụng đúng các HTML elements mà blog detail page sẽ style:
 * - h2 → Section heading với gold underline
 * - h3 → Subsection heading
 * - blockquote → Card info/strategy (viền trái navy)
 * - pre > code → Answer bar (nền navy, text vàng)
 * - ol → Numbered steps (navy circles)
 * - ul → Bullet points (gold dots)
 * - table → Bảng tổng hợp (navy header)
 * - hr → Gold dashed divider
 * - mark → Highlight vàng
 */

export const SAMPLE_POSTS = [
  {
    title: "Tổng hợp tất cả dạng bài IELTS Reading",
    slug: "tong-hop-dang-bai-ielts-reading",
    thumbnailUrl: "/images/blog/ielts-reading-guide.jpg",
    content: `
<h2>Tổng quan IELTS Academic Reading</h2>

<p>Bài thi IELTS Academic Reading gồm <strong>3 bài đọc</strong> với tổng cộng <strong>40 câu hỏi</strong> trong vòng <strong>60 phút</strong>. Văn bản lấy từ sách, tạp chí, báo khoa học — phù hợp trình độ undergraduate/postgraduate. Có tất cả <strong>11 dạng câu hỏi</strong> chính, được tổng hợp đầy đủ trong tài liệu này.</p>

<hr />

<h2>Matching Headings</h2>

<blockquote>
<p><strong>— DẠNG BÀI LÀ GÌ?</strong></p>
<p>Cho một danh sách tiêu đề (i–x) nhiều hơn số đoạn văn. Nhiệm vụ: chọn tiêu đề phù hợp nhất với <mark>ý chính</mark> của từng đoạn. Mỗi tiêu đề chỉ dùng một lần.</p>
</blockquote>

<blockquote>
<p><strong>— ĐIỂM CẦN NHỚ</strong></p>
<ul>
<li>Tiêu đề phản ánh <strong>ý chính</strong> của cả đoạn, không phải chi tiết</li>
<li>Các tiêu đề nhiều thường rất gần nghĩa nhau</li>
<li>Nhiều synonyms &amp; paraphrasing</li>
<li>Câu đầu &amp; câu cuối thường chứa ý chính</li>
</ul>
</blockquote>

<h3>⚡ Chiến thuật làm bài</h3>

<ol>
<li>Làm dạng này <strong>trước tất cả</strong> câu hỏi khác trong cùng bài đọc (nắm main idea → làm câu sau nhanh hơn)</li>
<li>Đọc lướt toàn bài trước để nắm cấu trúc tổng thể</li>
<li>Đọc kỹ <strong>câu đầu và câu cuối</strong> của mỗi đoạn — thường chứa ý chính</li>
<li>Viết tóm tắt ngắn gọn (2-3 từ) cho từng đoạn bằng ngôn ngữ của mình</li>
<li>Đối chiếu tóm tắt của mình với danh sách tiêu đề — chú ý synonym</li>
<li>Loại trừ các tiêu đề đã dùng; đoạn khó để lại làm sau cùng</li>
</ol>

<blockquote>
<p>⚠ <strong>Bẫy thường gặp:</strong> Một từ khóa trong đoạn xuất hiện trong nhiều tiêu đề — đừng chọn tiêu đề chỉ vì có cùng từ đó. Phải đảm bảo tiêu đề khớp với <em>ý chính toàn đoạn</em>.</p>
</blockquote>

<hr />

<h2>Matching Information</h2>

<blockquote>
<p><strong>— DẠNG BÀI LÀ GÌ?</strong></p>
<p>Cho danh sách thông tin (số liệu, ví dụ, lý do, mô tả). Nhiệm vụ: xác định thông tin đó nằm ở đoạn nào (A, B, C...). Một đoạn có thể được chọn nhiều lần.</p>
</blockquote>

<blockquote>
<p><strong>— ĐIỂM CẦN NHỚ</strong></p>
<ul>
<li>Thứ tự câu hỏi <strong>KHÔNG</strong> theo thứ tự đoạn văn</li>
<li>Một đoạn có thể có <strong>nhiều hơn một đáp án</strong></li>
<li>Tập trung vào <strong>chi tiết cụ thể</strong>, không phải ý chính</li>
<li>Keyword scanning là kỹ năng then chốt</li>
</ul>
</blockquote>

<h3>⚡ Chiến thuật làm bài</h3>

<ol>
<li>Đọc câu hỏi trước — highlight từ khóa quan trọng</li>
<li>Scan từng đoạn để tìm thông tin khớp (số liệu, tên người, ví dụ cụ thể)</li>
<li>Đừng đọc toàn bộ đoạn — chỉ dừng lại khi tìm thấy thông tin liên quan</li>
<li>Ghi nhớ: câu hỏi có thể paraphrase thông tin trong bài</li>
<li>Xử lý câu dễ trước, câu khó để sau</li>
</ol>

<hr />

<h2>Multiple Choice</h2>

<blockquote>
<p><strong>— DẠNG BÀI LÀ GÌ?</strong></p>
<p>Chọn đáp án đúng (A/B/C/D hoặc A-E chọn 2). Thứ tự câu hỏi THEO thứ tự bài đọc — đây là ưu điểm lớn giúp locate đáp án nhanh hơn.</p>
</blockquote>

<blockquote>
<p><strong>— ĐIỂM CẦN NHỚ</strong></p>
<ul>
<li>Câu hỏi theo thứ tự bài → <strong>scan theo vùng</strong></li>
<li>Đáp án nhiều thường dùng từ trong bài nhưng sai nghĩa</li>
<li>Đọc câu hỏi <strong>trước</strong> khi đọc đoạn liên quan</li>
<li>Kiểu "choose TWO" cần cẩn thận — không thứ tự</li>
</ul>
</blockquote>

<h3>⚡ Chiến thuật làm bài</h3>

<ol>
<li>Đọc câu hỏi + 4 options — highlight keyword trong câu hỏi</li>
<li>Scan bài đọc đến vùng liên quan (dùng vị trí câu hỏi trước/sau làm mốc)</li>
<li>Đọc kỹ đoạn đó, tìm thông tin ứng với câu hỏi</li>
<li>Loại trừ đáp án sai trước — thường còn 2 đáp án có vẻ đúng</li>
<li>Chọn đáp án khớp <em>nghĩa</em> với bài, không phải chỉ khớp từ</li>
</ol>

<hr />

<h2>True / False / Not Given</h2>

<blockquote>
<p><strong>— ĐỊNH NGHĨA 3 ĐÁP ÁN</strong></p>
<ul>
<li><strong>TRUE</strong> — thông tin trong bài xác nhận phát biểu</li>
<li><strong>FALSE</strong> — thông tin trong bài mâu thuẫn với phát biểu</li>
<li><strong>NOT GIVEN</strong> — bài không đề cập đến (không thể kết luận)</li>
</ul>
</blockquote>

<blockquote>
<p>⚠ <strong>Bẫy phổ biến nhất — NOT GIVEN:</strong> Nhiều học sinh chọn FALSE vì nghĩ "thông tin không có trong bài là sai". Sai! FALSE nghĩa là bài nói ngược lại. NOT GIVEN nghĩa là bài hoàn toàn không đề cập. Đây là điểm mấu chốt phân biệt học sinh band 6 và band 7+.</p>
</blockquote>

<h3>⚡ Chiến thuật làm bài</h3>

<ol>
<li>Đọc phát biểu → tìm keyword → scan bài tìm vùng liên quan</li>
<li>Đọc kỹ vùng đó: thông tin có khớp không?</li>
<li>Nếu khớp → TRUE. Nếu trái ngược → FALSE. Nếu không đề cập → NOT GIVEN</li>
<li>Tuyệt đối không dùng kiến thức ngoài để đoán NOT GIVEN</li>
<li>Nếu một phần phát biểu đúng nhưng phần khác không có → NOT GIVEN</li>
</ol>

<hr />

<h2>Sentence Completion</h2>

<blockquote>
<p><strong>— DẠNG BÀI LÀ GÌ?</strong></p>
<p>Hoàn thành câu bằng cách điền từ lấy <strong>trực tiếp từ bài đọc</strong>. Thường có giới hạn số từ (NO MORE THAN TWO WORDS / ONE WORD ONLY).</p>
</blockquote>

<blockquote>
<p><strong>— ĐIỂM CẦN NHỚ</strong></p>
<ul>
<li>Chỉ dùng từ <strong>có sẵn trong bài</strong> — không paraphrase</li>
<li>Đếm số từ kỹ: "a plastic bottle" = 3 từ (có A)</li>
<li>Câu hoàn thành phải đúng ngữ pháp</li>
<li>Câu hỏi theo thứ tự bài đọc</li>
</ul>
</blockquote>

<h3>⚡ Chiến thuật làm bài</h3>

<ol>
<li>Đọc câu chưa hoàn thành — dự đoán loại từ cần điền (noun? adj? verb?)</li>
<li>Scan bài để tìm vùng tương ứng</li>
<li>Đọc kỹ câu đó trong bài — tìm từ điền vào</li>
<li>Kiểm tra: câu hoàn thành có đúng nghĩa và ngữ pháp không?</li>
<li>Kiểm tra giới hạn từ — không thêm không bớt</li>
</ol>

<hr />

<h2>Summary Completion</h2>

<blockquote>
<p><strong>— DẠNG BÀI LÀ GÌ?</strong></p>
<p>Điền vào chỗ trống trong một đoạn tóm tắt (summary). Có hai biến thể: điền từ từ bài đọc (<em>word from the text</em>), hoặc chọn từ danh sách cho sẵn (<em>from a list A–H</em>).</p>
</blockquote>

<blockquote>
<p><strong>— ĐIỂM CẦN NHỚ</strong></p>
<ul>
<li>Summary thường cover 1-2 đoạn văn, không phải toàn bài</li>
<li>Đọc summary để nắm chủ đề trước khi tìm bài</li>
<li>Khi có danh sách: coi chừng từ nhiều có nghĩa gần đúng</li>
<li>Câu trong summary theo thứ tự bài đọc</li>
</ul>
</blockquote>

<h3>⚡ Chiến thuật làm bài</h3>

<ol>
<li>Đọc toàn bộ summary trước để hiểu chủ đề đang nói về gì</li>
<li>Xác định vùng bài đọc mà summary đang tóm tắt</li>
<li>Làm từng câu theo thứ tự — dùng từ trước và sau chỗ trống để predict loại từ</li>
<li>Nếu có list: loại trừ từ ngữ pháp không phù hợp trước</li>
<li>Đọc lại summary sau khi điền để kiểm tra logic toàn đoạn</li>
</ol>

<hr />

<h2>Short Answer Questions</h2>

<blockquote>
<p><strong>— DẠNG BÀI LÀ GÌ?</strong></p>
<p>Câu hỏi dạng <em>What? When? Where? How many?</em> — trả lời bằng từ lấy trực tiếp từ bài đọc. Giới hạn thường là NO MORE THAN THREE WORDS.</p>
</blockquote>

<blockquote>
<p><strong>— ĐIỂM CẦN NHỚ</strong></p>
<ul>
<li>Câu hỏi theo thứ tự bài đọc</li>
<li>Chỉ điền <strong>từ trong bài</strong> — không paraphrase</li>
<li>Câu trả lời thường là noun phrase cụ thể</li>
<li>Đây là dạng bài <strong>nhanh nhất</strong> để làm</li>
</ul>
</blockquote>

<h3>⚡ Chiến thuật làm bài</h3>

<ol>
<li>Đọc câu hỏi — xác định loại thông tin cần tìm (số, tên, địa điểm, lý do)</li>
<li>Scan bài theo thứ tự — tìm vùng liên quan</li>
<li>Locate câu trả lời chính xác trong bài</li>
<li>Chép đúng từ từ bài — kiểm tra số từ</li>
</ol>

<hr />

<h2>Diagram Labelling</h2>

<blockquote>
<p><strong>— DẠNG BÀI LÀ GÌ?</strong></p>
<p>Điền nhãn vào các phần của sơ đồ, hình vẽ, hoặc bản đồ. Thông tin được mô tả trong bài đọc. Giới hạn từ áp dụng tương tự các dạng điền từ khác.</p>
</blockquote>

<blockquote>
<p><strong>— ĐIỂM CẦN NHỚ</strong></p>
<ul>
<li>Sơ đồ thường là thiết bị, quy trình sinh học, hoặc địa lý</li>
<li>Mũi tên chỉ hướng giúp xác định thứ tự đọc</li>
<li>Dùng từ <strong>chính xác từ bài</strong></li>
<li>Thường xuất hiện ít câu hơn các dạng khác</li>
</ul>
</blockquote>

<h3>⚡ Chiến thuật làm bài</h3>

<ol>
<li>Nhìn tổng thể sơ đồ — đang mô tả cái gì?</li>
<li>Dùng label/nhãn đã có trong sơ đồ để locate vùng bài đọc</li>
<li>Đọc kỹ phần mô tả đó — tìm từ cho phần chưa có nhãn</li>
<li>Điền từ chính xác — chú ý plural/singular nếu cần</li>
</ol>

<hr />

<h2>Bảng Tổng hợp Nhanh — 11 Dạng Bài</h2>

<table>
<thead>
<tr>
<th>#</th>
<th>Dạng bài</th>
<th>Kiểm tra</th>
<th>Thứ tự?</th>
<th>Nguồn đáp án</th>
<th>Độ khó</th>
</tr>
</thead>
<tbody>
<tr><td>1</td><td>Matching Headings</td><td>Ý chính đoạn văn</td><td>Không</td><td>List cho sẵn</td><td>Khó</td></tr>
<tr><td>2</td><td>Matching Information</td><td>Chi tiết cụ thể</td><td>Không</td><td>Tên đoạn (A, B..)</td><td>TB</td></tr>
<tr><td>3</td><td>Matching Features</td><td>Ai nói/làm gì</td><td>Không</td><td>List cho sẵn</td><td>TB</td></tr>
<tr><td>4</td><td>Multiple Choice</td><td>Thông tin chi tiết</td><td>Có</td><td>A/B/C/D cho sẵn</td><td>TB</td></tr>
<tr><td>5</td><td>True / False / Not Given</td><td>Sự kiện thực tế</td><td>Có</td><td>T/F/NG</td><td>Khó</td></tr>
<tr><td>6</td><td>Yes / No / Not Given</td><td>Quan điểm tác giả</td><td>Có</td><td>Y/N/NG</td><td>Khó</td></tr>
<tr><td>7</td><td>Sentence Completion</td><td>Thông tin chi tiết</td><td>Có</td><td>Từ trong bài</td><td>TB</td></tr>
<tr><td>8</td><td>Summary Completion</td><td>Ý chính + chi tiết</td><td>Có</td><td>Bài / list cho sẵn</td><td>TB</td></tr>
<tr><td>9</td><td>Note/Table/Flow-chart</td><td>Thông tin cụ thể</td><td>Có</td><td>Từ trong bài</td><td>TB</td></tr>
<tr><td>10</td><td>Short Answer</td><td>Thông tin cụ thể</td><td>Có</td><td>Từ trong bài</td><td>Dễ</td></tr>
<tr><td>11</td><td>Diagram Labelling</td><td>Cấu trúc / quy trình</td><td>Không rõ</td><td>Từ trong bài</td><td>TB</td></tr>
</tbody>
</table>

<hr />

<h2>8 Nguyên tắc Vàng — IELTS Reading</h2>

<h3>1. KHÔNG ĐỌC TOÀN BÀI TRƯỚC</h3>
<p>Đọc câu hỏi trước, sau đó scan tìm thông tin liên quan. Đọc toàn bài mất thời gian không cần thiết.</p>

<h3>2. LUÔN TÌM SYNONYM</h3>
<p>Bài đọc gần như không bao giờ dùng lại từ y hệt câu hỏi. Phải nhận ra paraphrase và synonym.</p>

<h3>3. NOT GIVEN ≠ FALSE</h3>
<p>NOT GIVEN = thông tin không có trong bài. FALSE = bài nói ngược lại. Đây là sự khác biệt cốt lõi.</p>

<h3>4. MATCHING HEADINGS LÀM TRƯỚC</h3>
<p>Nếu bài có dạng này, làm trước hết — sẽ giúp hiểu bài tốt hơn cho các câu sau.</p>

<h3>5. QUẢN LÝ THỜI GIAN NGHIÊM NGẶT</h3>
<p>20 phút mỗi passage. Câu khó → skip, làm câu khác, quay lại sau. Không để stuck một câu quá 2 phút.</p>

<h3>6. CHÉP ĐÁP ÁN CHÍNH XÁC</h3>
<p>Với dạng điền từ: copy y chang từ bài, đúng spelling, đúng số từ. Sai một chữ = mất điểm.</p>

<h3>7. ĐỌC INSTRUCTION KỸ</h3>
<p>"No more than TWO words" và "ONE word only" là hoàn toàn khác nhau. Đọc instruction mỗi nhóm câu hỏi trước khi làm.</p>

<h3>8. TRANSFER ANSWERS CẨN THẬN</h3>
<p>Kiểm tra lại answer sheet trước khi hết giờ. IELTS Academic Reading không có thêm thời gian transfer như Listening.</p>
    `.trim(),
  },

  {
    title: "10 Mẹo Luyện Listening IELTS Hiệu Quả",
    slug: "10-meo-luyen-listening-ielts",
    thumbnailUrl: "/images/blog/ielts-listening-tips.jpg",
    content: `
<h2>Tổng quan IELTS Listening</h2>

<p>IELTS Listening gồm <strong>4 phần</strong> (Part 1-4), tổng cộng <strong>40 câu hỏi</strong>, thời gian nghe khoảng <strong>30 phút</strong> + 10 phút chuyển đáp án. Độ khó tăng dần từ Part 1 đến Part 4.</p>

<hr />

<h2>Mẹo 1: Đọc câu hỏi trước khi nghe</h2>

<p>Tận dụng thời gian giữa các phần để đọc trước câu hỏi. Gạch chân <mark>keyword</mark> quan trọng — đặc biệt là số liệu, tên người, địa điểm.</p>

<h2>Mẹo 2: Chú ý từ nối và tín hiệu</h2>

<blockquote>
<p><strong>Các từ tín hiệu quan trọng:</strong></p>
<ul>
<li><strong>However, but, although</strong> → đáp án thường ở SAU các từ này</li>
<li><strong>Actually, in fact</strong> → sửa lại thông tin trước đó</li>
<li><strong>First, then, finally</strong> → thứ tự các bước</li>
</ul>
</blockquote>

<h2>Mẹo 3: Cẩn thận với "bẫy" thay đổi đáp án</h2>

<p>Người nói thường đưa ra một đáp án rồi <strong>sửa lại</strong>. Ví dụ: "The meeting is on Monday... no wait, they changed it to <mark>Tuesday</mark>." — đáp án đúng là Tuesday.</p>

<h2>Mẹo 4: Spelling phải chính xác</h2>

<p>Sai spelling = mất điểm. Luyện viết các từ thường gặp: tên tháng, số, địa chỉ, nghề nghiệp.</p>

<h2>Mẹo 5: Nghe podcast và TED Talks hàng ngày</h2>

<p>Nghe 15-20 phút mỗi ngày với các chủ đề học thuật. Bắt đầu với subtitle, sau đó bỏ dần.</p>

<hr />

<h2>Bảng tóm tắt 4 phần Listening</h2>

<table>
<thead>
<tr><th>Part</th><th>Bối cảnh</th><th>Số người nói</th><th>Độ khó</th></tr>
</thead>
<tbody>
<tr><td>1</td><td>Hội thoại đời thường</td><td>2</td><td>Dễ</td></tr>
<tr><td>2</td><td>Độc thoại đời thường</td><td>1</td><td>TB</td></tr>
<tr><td>3</td><td>Hội thoại học thuật</td><td>2-3</td><td>Khó</td></tr>
<tr><td>4</td><td>Bài giảng học thuật</td><td>1</td><td>Rất khó</td></tr>
</tbody>
</table>
    `.trim(),
  },

  {
    title: "Cách Viết IELTS Writing Task 2 Đạt Band 7+",
    slug: "cach-viet-ielts-writing-task-2-band-7",
    thumbnailUrl: "/images/blog/ielts-writing-task2.jpg",
    content: `
<h2>Cấu trúc bài Writing Task 2</h2>

<p>IELTS Writing Task 2 yêu cầu viết bài luận <strong>250 từ trở lên</strong> trong <strong>40 phút</strong>. Bài luận chiếm <strong>2/3 tổng điểm Writing</strong> — quan trọng hơn Task 1.</p>

<blockquote>
<p><strong>4 tiêu chí chấm điểm (mỗi tiêu chí 25%):</strong></p>
<ul>
<li><strong>Task Response</strong> — Trả lời đúng yêu cầu đề</li>
<li><strong>Coherence & Cohesion</strong> — Logic và liên kết</li>
<li><strong>Lexical Resource</strong> — Vốn từ vựng</li>
<li><strong>Grammatical Range & Accuracy</strong> — Ngữ pháp đa dạng và chính xác</li>
</ul>
</blockquote>

<hr />

<h2>5 dạng đề phổ biến</h2>

<h3>1. Opinion (Agree/Disagree)</h3>
<p>"To what extent do you agree or disagree?" — Nêu rõ quan điểm và bảo vệ xuyên suốt bài.</p>

<h3>2. Discussion (Discuss both views)</h3>
<p>"Discuss both views and give your opinion." — Phân tích cả 2 phía rồi nêu quan điểm riêng.</p>

<h3>3. Problem & Solution</h3>
<p>"What are the problems and solutions?" — Nêu vấn đề + đề xuất giải pháp cụ thể.</p>

<h3>4. Advantages & Disadvantages</h3>
<p>"Do the advantages outweigh the disadvantages?" — Phân tích lợi/hại, kết luận phía nào nặng hơn.</p>

<h3>5. Two-part Question</h3>
<p>Hai câu hỏi riêng biệt — phải trả lời ĐỦ cả hai trong bài luận.</p>

<hr />

<h2>Công thức viết band 7+</h2>

<ol>
<li><strong>Mở bài (2-3 câu):</strong> Paraphrase đề bài + nêu thesis statement rõ ràng</li>
<li><strong>Thân bài 1 (5-7 câu):</strong> Topic sentence + Example/Explanation + Kết nối</li>
<li><strong>Thân bài 2 (5-7 câu):</strong> Topic sentence + Example/Explanation + Kết nối</li>
<li><strong>Kết bài (2-3 câu):</strong> Tóm tắt quan điểm, KHÔNG thêm ý mới</li>
</ol>

<blockquote>
<p>⚠ <strong>Lỗi phổ biến nhất:</strong> Viết lan man không có topic sentence rõ ràng ở đầu mỗi đoạn. Giám khảo đọc topic sentence đầu tiên — nếu không rõ, cả đoạn bị đánh giá thấp.</p>
</blockquote>
    `.trim(),
  },
];