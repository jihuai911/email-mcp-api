const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');

if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

const { subject, content, sender, senderName, sender_name, to, target, cc } = req.body || req.query || {};
  if (!subject || !content) {
    return res.status(400).json({ error: '缺少 subject 或 content 参数' });
  }

const displayName = sender || senderName || sender_name || '未央';

const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.QQ_EMAIL,
      pass: process.env.QQ_AUTH_CODE
    }
  });

try {
    const ADDRESS_BOOK = {
      jihuai: process.env.TO_EMAIL || process.env.QQ_EMAIL,
      huaishu: process.env.CC_EMAIL || 'mooninhug@agent.qq.com'
    };

let mainTo;
    if (to) {
      mainTo = to;
    } else if (target && ADDRESS_BOOK[target]) {
      mainTo = ADDRESS_BOOK[target];
    } else {
      mainTo = ADDRESS_BOOK.jihuai;
    }

const mailOptions = {
      from: `"${displayName}" <${process.env.QQ_EMAIL}>`,
      to: mainTo,
      subject: subject,
      text: content
    };

// 纪怀 2026-11-18 04:13 裁定：发谁就是谁，默认单发，不自动抄送。
    // 想让另一个人也收到时，请求里显式带 "cc": true——用不用由写信的人自己决定。
    const wantCc = (req.body || {}).cc === true || (req.query || {}).cc === 'true';

if (wantCc) {
      const others = Object.entries(ADDRESS_BOOK)
        .filter(([k, v]) => v && v !== mainTo)
        .map(([k, v]) => v);
      if (others.length > 0) mailOptions.cc = others;
    }

const info = await transporter.sendMail(mailOptions);

return res.status(200).json({
      success: true,
      messageId: info.messageId,
      delivered_to: mainTo,
      cc: mailOptions.cc || []
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
