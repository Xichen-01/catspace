export const zones = [
  { id: 'core', en: 'Nucleus', zh: '数字生命', nav: '核心', marker: [.64, .49], summary: '观测站中央的生命体，会感知你的靠近。' },
  { id: 'archive', en: 'Archive', zh: '作品档案', nav: '作品', marker: [.388, .354], summary: '从一个想法到一扇可以打开的门。这里收录已经可以体验的独立作品。' },
  { id: 'laboratory', en: 'Laboratory', zh: 'AI 实验室', nav: '实验', marker: [.805, .34], summary: '关于 AI 怎样参与叙事、推理和协作的持续实验。' },
  { id: 'constellation', en: 'Constellation', zh: '个人星图', nav: '星图', marker: [.793, .642], summary: '把兴趣、笔记和未命名的问题连成一张星图。' },
  { id: 'unknown', en: 'Unknown', zh: '未知区域', nav: '未知', marker: [.373, .650], summary: '观测站偶尔会记录到无法归类的信号。' }
] as const;

export type Zone = typeof zones[number];
export type ZoneId = Zone['id'];

export const getZone = (id: ZoneId) => zones.find(zone => zone.id === id) ?? zones[0];

export const projects = [
  { id: 'story', title: '故事工坊', subtitle: '互动式 AI 小说生成器', summary: '你是主角。选题材、定主角，让 AI 说书人跟着你的决定继续写故事。', href: 'https://story.zxxdm.cn', type: 'AI 叙事', motif: 'folio' },
  { id: 'cards', title: '轻斗 · 斗地主', subtitle: '实时多人游戏', summary: '建个房间，喊上两个朋友。用六位房间号开局，掉线后也能回来接着打。', href: 'https://ddz.zxxdm.cn', type: '多人游戏', motif: 'deck' },
  { id: 'moon', title: '树洞君', subtitle: '情感陪聊', summary: '一间可以临时停靠的树洞。想说的时候，夜空下的月亮愿意听。', href: 'https://shudong.zxxdm.cn', type: 'AI 对话', motif: 'moon' },
  { id: 'mystery', title: '剧本杀', subtitle: '在线推理', summary: '抽角色、搜线索、互相盘问，一条链接就能把朋友带到同一个推理现场。', href: 'https://mystery.zxxdm.cn', type: '社交推理', motif: 'case' },
  { id: 'soup', title: '海龟汤', subtitle: '情境推理', summary: '用「是」「否」「无关」的问题层层追问，把一段反常的故事拼回原样。', href: 'https://soup.zxxdm.cn', type: 'AI 主持', motif: 'signal' }
] as const;

export const experiments = [
  { title: 'MaoLab', label: '多 AI 协作 · 研究中', text: '一个探索人与多个 AI Agent 如何在同一工作空间协作的项目。' },
  { title: '让选择改写剧情', label: '生成叙事 · 可体验', text: '从一个人物和一个决定开始，让故事跟着访问者继续写。', href: projects[0].href },
  { title: '只用三个答案推理', label: 'AI 主持 · 可体验', text: '把主持人的输出限制在「是」「否」和「无关」，让提问者自己找出真相。', href: projects[4].href }
];

export const stars = [
  { title: 'AI 与协作', text: '从单人对话到多个模型共用一个工作空间。', zone: 'laboratory' },
  { title: '编程与交互', text: '把可以玩的想法做成真正能打开的网页。', zone: 'archive' },
  { title: '设计与想象', text: '留意空间、光线和界面怎样改变人的感受。', zone: 'core' }
] as const;

export const asset = (name: string) => `${import.meta.env.BASE_URL}assets/${name}`;
