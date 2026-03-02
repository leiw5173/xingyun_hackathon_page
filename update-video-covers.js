// 自动化抓取 B站视频封面并更新到 HTML
// 使用方法：node update-video-covers.js

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const HTML_FILE = path.join(__dirname, 'index.html');
const COVERS_DIR = path.join(__dirname, 'assets', 'covers');

// 从 HTML 中提取所有 BV 号
function extractBvids(html) {
    const bvidRegex = /data-bvid="(BV[a-zA-Z0-9]+)"/g;
    const bvids = [];
    let match;
    while ((match = bvidRegex.exec(html)) !== null) {
        bvids.push(match[1]);
    }
    return [...new Set(bvids)]; // 去重
}

// 获取单个视频的封面
function getVideoCover(bvid) {
    return new Promise((resolve, reject) => {
        const url = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
        
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://www.bilibili.com/'
            }
        }, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.code === 0 && json.data && json.data.pic) {
                        resolve({
                            bvid: bvid,
                            cover: json.data.pic,
                            title: json.data.title || ''
                        });
                    } else {
                        reject(new Error(`API returned error: ${json.code} - ${json.message || 'Unknown error'}`));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

// 下载图片到本地，返回相对路径
function downloadCoverToLocal(url, bvid) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        protocol.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.bilibili.com/'
            }
        }, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                return downloadCoverToLocal(res.headers.location, bvid).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode}`));
                return;
            }
            const filePath = path.join(COVERS_DIR, bvid + '.jpg');
            const file = fs.createWriteStream(filePath);
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve('assets/covers/' + path.basename(filePath));
            });
        }).on('error', reject);
    });
}

// 批量获取封面（带延迟避免请求过快）
async function getAllCovers(bvids) {
    const results = [];
    const errors = [];
    
    console.log(`\n开始获取 ${bvids.length} 个视频的封面...\n`);
    
    for (let i = 0; i < bvids.length; i++) {
        const bvid = bvids[i];
        try {
            console.log(`[${i + 1}/${bvids.length}] 正在获取 ${bvid}...`);
            const result = await getVideoCover(bvid);
            results.push(result);
            console.log(`  ✓ 成功: ${result.cover}`);
        } catch (error) {
            console.error(`  ✗ 失败: ${error.message}`);
            errors.push({ bvid, error: error.message });
        }
        
        // 延迟 500ms，避免请求过快
        if (i < bvids.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    console.log(`\n完成！成功: ${results.length}, 失败: ${errors.length}`);
    if (errors.length > 0) {
        console.log('\n失败的视频:');
        errors.forEach(e => console.log(`  - ${e.bvid}: ${e.error}`));
    }
    
    return results;
}

// 更新 HTML 文件（cover 为相对路径，如 assets/covers/BVxxx.jpg）
function updateHTML(html, covers) {
    let updatedHTML = html;
    
    covers.forEach(({ bvid, localCover }) => {
        const regex = new RegExp(`(data-bvid="${bvid}")(\\s+data-cover="[^"]*")?`, 'g');
        updatedHTML = updatedHTML.replace(regex, `$1 data-cover="${localCover}"`);
    });
    
    return updatedHTML;
}

// 主函数
async function main() {
    try {
        console.log('读取 HTML 文件...');
        const html = fs.readFileSync(HTML_FILE, 'utf8');
        
        console.log('提取 BV 号...');
        const bvids = extractBvids(html);
        console.log(`找到 ${bvids.length} 个视频: ${bvids.join(', ')}`);
        
        // 获取所有封面
        const covers = await getAllCovers(bvids);
        
        if (covers.length === 0) {
            console.log('\n没有成功获取任何封面，退出。');
            return;
        }
        
        // 创建 covers 目录并下载封面到本地（避免 B站 CDN 防盗链 403）
        if (!fs.existsSync(COVERS_DIR)) {
            fs.mkdirSync(COVERS_DIR, { recursive: true });
            console.log('\n已创建目录: assets/covers');
        }
        console.log('\n下载封面到本地...');
        const withLocal = [];
        for (let i = 0; i < covers.length; i++) {
            const { bvid, cover } = covers[i];
            try {
                const localPath = await downloadCoverToLocal(cover, bvid);
                withLocal.push({ bvid, localCover: localPath });
                console.log(`  [${i + 1}/${covers.length}] ${bvid} -> ${localPath}`);
            } catch (e) {
                console.error(`  [${i + 1}/${covers.length}] ${bvid} 下载失败: ${e.message}`);
            }
            if (i < covers.length - 1) await new Promise(r => setTimeout(r, 300));
        }
        if (withLocal.length === 0) {
            console.log('\n没有成功下载任何封面，退出。');
            return;
        }
        
        // 更新 HTML
        console.log('\n更新 HTML 文件...');
        const updatedHTML = updateHTML(html, withLocal);
        
        // 备份原文件
        const backupFile = HTML_FILE + '.backup.' + Date.now();
        fs.writeFileSync(backupFile, html, 'utf8');
        console.log(`已备份原文件到: ${backupFile}`);
        
        // 保存更新后的文件
        fs.writeFileSync(HTML_FILE, updatedHTML, 'utf8');
        console.log(`\n✓ HTML 文件已更新！`);
        console.log(`已为 ${withLocal.length} 个视频添加本地封面。`);
        
        // 显示更新摘要
        console.log('\n更新摘要:');
        withLocal.forEach(({ bvid, localCover }) => {
            console.log(`  ${bvid}: ${localCover}`);
        });
        
    } catch (error) {
        console.error('错误:', error);
        process.exit(1);
    }
}

// 运行
main();
