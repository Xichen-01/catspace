import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';
import { asset, experiments, getZone, projects, stars, zones, type ZoneId } from './content';
import Icon from './icons';
import World, { type Route, zoneIcons } from './World';
import { initialLife, lifeStyles, nextLife, timing, zoneOrder, type LifeEvent } from './motion';
import { ObservatorySound } from './sound';
import './styles.css';
import './world.css';

type Mode = Route['mode'];
const motionOff = new URLSearchParams(location.search).get('motion') === 'off';
const homeRoute: Route = { mode: 'explore', zone: 'core', focused: false };

function readRoute(): Route {
  const [mode, zone] = location.hash.slice(1).split('/');
  if (mode !== 'explore' && mode !== 'browse') return homeRoute;
  const found = zones.find(item => item.id === zone);
  return { mode, zone: found?.id ?? 'core', focused: Boolean(found) };
}

function readCat() {
  try { return sessionStorage.getItem('catspace-v4-signal') === 'found'; }
  catch { return false; }
}

function ProjectGrid({ compact = false }: { compact?: boolean }) {
  return <div className={compact ? 'project-links' : 'project-grid'}>
    {projects.map(project => <a className={compact ? 'list-link' : 'project-card'} href={project.href} target="_blank" rel="noopener noreferrer" key={project.id}>
      {!compact && <div className={`project-art project-art--${project.motif}`} aria-hidden="true"><span /><i /><b /></div>}
      <div className="project-meta"><div>
        {!compact && <span className="micro">{project.type}</span>}
        <h3>{project.title}</h3>
        {compact ? <p>{project.subtitle}</p> : <p>{project.summary}</p>}
      </div><Icon name="external" /></div>
    </a>)}
  </div>;
}

function ZoneContent({ id, cat, onSelect }: { id: ZoneId; cat: boolean; onSelect: (id: ZoneId) => void }) {
  if (id === 'archive') return <ProjectGrid compact />;
  if (id === 'laboratory') return <div className="experiment-list">{experiments.map(item => <article key={item.title}>
    <span className="micro">{item.label}</span><h3>{item.title}</h3><p>{item.text}</p>
    {item.href && <a className="text-link" href={item.href} target="_blank" rel="noopener noreferrer">体验作品 <Icon name="external" /></a>}
  </article>)}</div>;
  if (id === 'constellation') return <div className="star-list">{stars.map(star => <button key={star.title} className="list-link" onClick={() => onSelect(star.zone)}>
    <div className="project-meta"><div><h3>{star.title}</h3><p>{star.text}</p></div><Icon name="spark" /></div>
  </button>)}
    <details className="field-note"><summary>观测手记 · 为什么做一座观测站</summary>
      <p>作品集会把已经完成的东西排整齐。观测站还给进行中的实验留了位置。两种入口分别服务于查找和探索，内容地址可以在两边切换。</p>
      <p>站里留了一块空地给尚未命名的点子，值班猫替它看门。</p>
    </details>
  </div>;
  if (id === 'unknown') return <div className="unknown-log">
    <Icon name="signal" />
    <h3>{cat ? '值班猫的留言' : '还有一个信号'}</h3>
    <p>{cat ? '每次回来，记得给好奇心留个位置。——值班猫' : '去中央光环附近看看。那里有一位习惯独自巡逻的居民。'}</p>
  </div>;
  return <div className="core-log">
    <p>你好，我是脏兮兮的猫，一个喜欢折腾 AI、编程和设计的学生。这里是我的私人观测站。</p>
    <div className="detail-links"><a className="text-link" href="https://open.zxxdm.cn" target="_blank" rel="noopener noreferrer">开源项目 <Icon name="external" /></a>
    <a className="text-link" href="https://github.com/Xichen-01" target="_blank" rel="noopener noreferrer">GitHub <Icon name="external" /></a></div>
  </div>;
}

function Browse({ route, cat, onMode, onSelect, onCat }: {
  route: Route; cat: boolean; onMode: (mode: Mode) => void; onSelect: (zone: ZoneId) => void; onCat: () => void;
}) {
  const selector = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (route.focused) selector.current?.scrollIntoView({ block: 'start' });
  }, [route.zone, route.focused]);

  return <main id="main" className="browse">
    <div className="browse-shell">
      <section className="browse-hero">
        <div className="browse-hero-copy">
          <p className="micro"><span className="live-dot" /> 脏兮兮的猫的私人观测站</p>
          <h1>一点点搭建<br />我的<span>数字宇宙</span>。</h1>
          <p>一个爱折腾 AI 的学生。这里收录我做的小产品、正在尝试的实验，以及还没找到答案的问题。</p>
          <button className="action action--outline" onClick={() => onMode('explore')}><Icon name="enter" /> 进入观测站</button>
        </div>
        <div className="browse-image" role="img" aria-label="环形观测站与窗外的星海"><picture><source media="(max-width: 740px)" srcSet={asset('observatory-compact.webp')} /><img src={asset('observatory.webp')} alt="" width="1672" height="941" /></picture><div><Icon name="orbit" /> CATSPACE OBSERVATORY</div></div>
      </section>
      <div className="browse-index" ref={selector}>
        <nav aria-label="浏览栏目" className="index-bar">
          {zones.map(zone => <button key={zone.id} aria-pressed={(route.focused ? route.zone : 'archive') === zone.id} onClick={() => onSelect(zone.id)}>
            <Icon name={zoneIcons[zone.id]} />{zone.id === 'core' ? '关于我' : zone.zh}
          </button>)}
        </nav>
        <section className="browse-content" aria-labelledby="section-title">
          {(() => {
            const zone = getZone(route.focused ? route.zone : 'archive');
            return <><div className="section-title"><div><p className="micro">{zone.en}</p><h2 id="section-title">{zone.id === 'core' ? '关于我' : zone.zh}</h2></div><p>{zone.summary}</p></div>
            {zone.id === 'archive' ? <ProjectGrid /> :
              <><ZoneContent id={zone.id} cat={cat} onSelect={onSelect} />
              {zone.id === 'unknown' && !cat && <button className="action action--outline browse-cat" onClick={onCat}><Icon name="signal" /> 搜索信号</button>}</>}
            </>;
          })()}
        </section>
      </div>
      <footer className="browse-footer"><span><Icon name="orbit" /> CATSPACE</span><a href="../v3/">回看 CATSPACE V3 <Icon name="external" /></a></footer>
    </div>
  </main>;
}

function App() {
  const [route, setRoute] = useState(readRoute);
  const [life, setLife] = useState(() => initialLife(performance.now()));
  const lifeNow = useRef(life);
  const [arrival, setArrival] = useState<ZoneId | null>(null);
  const [departing, setDeparting] = useState<ZoneId | null>(null);
  const [cat, setCat] = useState(readCat);
  const [guide, setGuide] = useState(false);
  const [notice, setNotice] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [reduced, setReduced] = useState(() => motionOff || matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [sound, setSound] = useState(false);
  const audio = useRef(new ObservatorySound());
  const audioWanted = useRef(false);
  const details = useRef<HTMLElement>(null);
  const detailTrigger = useRef<HTMLElement | null>(null);
  const zone = getZone(route.zone);
  const landed = route.focused && arrival === route.zone;
  const quiet = route.mode !== 'explore';
  const readyToResonate = life.phase === 'awakening' || life.phase === 'resonance';

  function advance(event: LifeEvent) {
    const next = nextLife(lifeNow.current, event, performance.now());
    if (next === lifeNow.current) return;
    lifeNow.current = next;
    setLife(next);
  }

  useEffect(() => {
    const sync = () => { setArrival(null); setDeparting(null); setRoute(readRoute()); setGuide(false); };
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const motion = (event: MediaQueryListEvent) => setReduced(motionOff || event.matches);
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    mq.addEventListener('change', motion);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
      mq.removeEventListener('change', motion);
    };
  }, []);

  useEffect(() => {
    if (quiet) return;
    const timer = window.setInterval(() => { if (!document.hidden) advance('tick'); }, 130);
    return () => window.clearInterval(timer);
  }, [quiet]);

  useEffect(() => {
    const listener = () => audio.current.audible(sound && !quiet && !document.hidden);
    listener();
    document.addEventListener('visibilitychange', listener);
    return () => document.removeEventListener('visibilitychange', listener);
  }, [sound, quiet]);

  useEffect(() => {
    if (!departing) return;
    const timer = window.setTimeout(() => setDeparting(null), timing.exit);
    return () => clearTimeout(timer);
  }, [departing]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (route.mode === 'explore' && landed) details.current?.focus({ preventScroll: true });
  }, [route.mode, route.zone, landed]);

  function go(next: Route) {
    const hash = `#${next.mode}${next.focused ? '/' + next.zone : ''}`;
    if (location.hash !== hash) history.pushState(null, '', hash);
    if (next.mode !== route.mode || next.focused !== route.focused || next.zone !== route.zone) {
      if (next.mode === 'explore' && landed && !reduced) setDeparting(route.zone);
      else if (next.mode !== 'explore') setDeparting(null);
      setArrival(null);
    }
    setRoute(next);
    setMobileMenu(false);
  }

  function mode(next: Mode) {
    if (route.mode === next) return;
    if (next === 'browse') {
      advance('depart');
      setGuide(false);
    }
    go({ ...route, mode: next });
    if (next === 'explore' || !route.focused) window.scrollTo(0, 0);
  }

  function select(id: ZoneId, following = false) {
    if (!route.focused && document.activeElement instanceof HTMLElement) detailTrigger.current = document.activeElement;
    if (id !== 'core') advance('depart');
    if (!following) setGuide(false);
    go({ ...route, zone: id, focused: true });
  }

  function arrive(id: ZoneId) {
    if (route.mode !== 'explore' || !route.focused || zone.id !== id) return;
    setArrival(id);
    setDeparting(null);
    audio.current.cue('arrival');
    if (id === 'unknown' && guide) setGuide(false);
  }

  function closeDetail() {
    if (route.zone === 'core') advance('depart');
    setGuide(false);
    go({ ...route, zone: 'core', focused: false });
    requestAnimationFrame(() => detailTrigger.current?.focus());
  }

  function awaken() {
    const before = lifeNow.current.phase;
    advance('activate');
    const now = lifeNow.current.phase;
    if (before !== now && now === 'awakening') {
      audio.current.cue('wake');
      setNotice('数字生命正在苏醒');
    }
    if (before !== now && now === 'resonance') {
      audio.current.cue('resonate');
      setNotice('共鸣已建立');
    }
    select('core');
  }

  function resonate() {
    if (lifeNow.current.phase === 'resonance') return;
    advance('resonate');
    audio.current.cue('resonate');
    setNotice('共鸣已建立');
  }

  function recordCat() {
    try { sessionStorage.setItem('catspace-v4-signal', 'found'); } catch { /* retained for the current visit */ }
    setCat(true);
  }

  function findCat() {
    if (route.mode === 'browse') {
      recordCat();
      setNotice('已收到值班猫的留言');
      return;
    }
    if (route.focused) closeDetail();
    setGuide(true);
    audio.current.cue('cat');
    setNotice('');
  }

  function followCat() {
    recordCat();
    if (route.zone === 'unknown' && landed) setGuide(false);
    select('unknown', true);
  }

  async function toggleSound() {
    const wanted = !audioWanted.current;
    audioWanted.current = wanted;
    if (!wanted) {
      audio.current.disable();
      setSound(false);
      return;
    }
    try {
      await audio.current.enable();
      if (audioWanted.current) setSound(true);
    } catch {
      audioWanted.current = false;
      setSound(false);
      setNotice('当前设备无法启用环境音');
    }
  }

  function home() {
    advance('depart');
    setGuide(false);
    go({ ...route, zone: 'core', focused: false });
    window.scrollTo(0, 0);
  }

  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (mobileMenu) setMobileMenu(false);
      else if (guide && !route.focused) setGuide(false);
      else if (route.mode === 'explore' && route.focused) closeDetail();
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  });

  const panel = landed ? zone : departing ? getZone(departing) : null;
  const travelIndex = panel ? zoneOrder.indexOf(panel.id) : -1;

  return <div className={`app app-v4 app--${route.mode}`} style={{
    '--press-time': `${timing.press}ms`, '--reveal-time': `${timing.reveal}ms`, '--exit-time': `${timing.exit}ms`
  } as CSSProperties} data-motion={reduced ? 'reduced' : undefined}>
    <a className="skip" href={quiet ? '#main' : '#explore-main'} onClick={event => {
      event.preventDefault();
      const main = document.getElementById(quiet ? 'main' : 'explore-main');
      main?.setAttribute('tabindex', '-1');
      main?.focus();
    }}>跳至主要内容</a>
    <header className="top">
      <button className="brand" aria-label="CATSPACE 首页" onClick={home}>
        <span className="brand-orbit"><Icon name="orbit" /></span><span className="brand-name">CATSPACE<small>THE AWAKENING</small></span>
      </button>
      <nav className={`top-nav ${mobileMenu ? 'is-open' : ''}`} aria-label="主导航">
        <button aria-current={!route.focused ? 'page' : undefined} onClick={home}>首页</button>
        {(['archive', 'laboratory', 'constellation', 'core'] as const).map(id => <button key={id}
          aria-current={route.focused && route.zone === id ? 'page' : undefined}
          onClick={() => select(id)}>{id === 'core' ? '关于' : getZone(id).nav}</button>)}
      </nav>
      <div className="top-actions">
        <button className="sound-toggle" aria-label="环境音" aria-pressed={sound} title={sound ? '关闭环境音' : '开启环境音'} onClick={toggleSound}><Icon name={sound ? 'sound' : 'mute'} /></button>
        <button className="mode-toggle" onClick={() => mode(quiet ? 'explore' : 'browse')}>
          <Icon name={quiet ? 'enter' : 'grid'} /><span>{quiet ? '探索模式' : '浏览模式'}</span>
        </button>
        <button className="menu-toggle" aria-label={mobileMenu ? '关闭菜单' : '打开菜单'} aria-expanded={mobileMenu}
          onClick={() => setMobileMenu(value => !value)}><Icon name={mobileMenu ? 'close' : 'menu'} /></button>
      </div>
    </header>

    <div hidden={quiet} className="explore-page">
      <World route={route} life={life} reduced={reduced} guide={guide} onApproach={value => advance(value ? 'near' : 'leave')}
        onArrival={arrive} onFocus={select} onWake={awaken} onCat={guide ? followCat : findCat}>
        <section className="intro" inert={route.focused} aria-hidden={route.focused || undefined}>
          <p className="micro"><span className="live-dot" /> 私人观测站 <span className="station-tag">/ OBSERVATORY</span></p>
          <h1>我的<br />数字宇宙<span>.</span></h1>
          <p className="intro-text">我是脏兮兮的猫。这里收藏我的作品、AI 实验和一点好奇心。</p>
          <div className="intro-actions">
            <button className="action action--primary" onClick={awaken}><Icon name="enter" /> 进入观测站<Icon className="action-trail" name="arrow" /></button>
            <button className="action action--outline" onClick={() => mode('browse')}><Icon name="grid" /> 日常浏览</button>
          </div>
        </section>

        {route.focused && !landed && <>
          <div className="target-reticle" aria-hidden="true"><i /></div>
          <div className="journey-prompt" aria-hidden="true"><Icon name={zoneIcons[zone.id]} /><span>前往 {zone.zh}</span><i /></div>
        </>}

        {panel && <aside key={panel.id} className={`zone-detail zone-console ${landed ? '' : 'zone-console--leaving'}`} tabIndex={-1}
          inert={!landed} aria-hidden={!landed || undefined} data-console-zone={panel.id} ref={landed ? details : undefined} aria-labelledby="zone-title">
          <div className="detail-top"><span className="micro"><Icon name={zoneIcons[panel.id]} /> {panel.en}</span>
            <button className="close" aria-label="返回观测大厅" onClick={closeDetail}><Icon name="close" /></button></div>
          <h2 id="zone-title">{panel.zh}</h2><p className="detail-summary">{panel.summary}</p>
          {panel.id === 'core' && <div className="core-dialogue">
            <span><i className="live-dot" /> {lifeStyles[life.phase].label}</span>
            <p>{life.phase === 'resonance' ? '光流已经连入中央光环。' : readyToResonate ? '它正在回应你。再给它一个信号。' : '靠近它，或者轻触生命体。'}</p>
          </div>}
          <ZoneContent id={panel.id} cat={cat} onSelect={select} />
          {panel.id === 'unknown' && !cat && <button className="text-link detail-mode" onClick={findCat}><Icon name="signal" /> 寻找值班猫</button>}
          <button className="text-link detail-mode" onClick={panel.id === 'core' ? (readyToResonate ? resonate : awaken) : () => mode('browse')}>
            <Icon name={panel.id === 'core' ? 'spark' : 'grid'} /> {panel.id === 'core' ? (readyToResonate ? '与核心共鸣' : '唤醒生命体') : '在浏览模式中打开'}
          </button>
          {panel.id !== 'core' && <div className="neighbour-links" aria-label="相邻区域">
            {travelIndex > 0 && <button className="text-link" onClick={() => select(zoneOrder[travelIndex - 1])}><Icon name="back" /> {getZone(zoneOrder[travelIndex - 1]).zh}</button>}
            {travelIndex < zoneOrder.length - 1 && <button className="text-link" onClick={() => select(zoneOrder[travelIndex + 1])}>{getZone(zoneOrder[travelIndex + 1]).zh} <Icon name="arrow" /></button>}
          </div>}
        </aside>}

        {guide && !(route.focused && route.zone === 'unknown') && <div className="guide-strip">
          <span><i className="live-dot" /> 值班猫发现了一个信号</span>
          <button type="button" onClick={followCat}>跟上它 <Icon name="arrow" /></button>
          <button type="button" className="guide-close" aria-label="停止跟随" onClick={() => setGuide(false)}><Icon name="close" /></button>
        </div>}

        <div className="station-footer">
          <div className="station-place"><Icon name="orbit" /><span>
            <strong>{landed ? zone.zh : '中央观测厅'}</strong><small>CATSPACE OBSERVATORY</small></span></div>
          <nav className="dock" aria-label="空间导航">
            {zones.map(item => <button key={item.id} aria-pressed={item.id === zone.id} onClick={() => select(item.id)}>
              <Icon name={zoneIcons[item.id]} /><span>{item.nav}</span></button>)}
          </nav>
          {route.focused && !landed
            ? <button type="button" className="station-signal transit-cancel" aria-label="取消前往" onClick={closeDetail}><span><Icon name="close" /> 取消前往</span></button>
            : <button className="station-signal" aria-label={cat ? '查看值班猫的留言' : '寻找值班猫'} onClick={cat ? () => select('unknown') : findCat}>
              <span><i className="live-dot" /> {cat ? '留言已接收' : '值班猫的信号'}</span><Icon name="signal" />
            </button>}
        </div>
        {!route.focused && !guide && <p className="touch-hint">左右滑动观测窗 · 轻触核心</p>}
      </World>
    </div>
    {quiet && <Browse route={route} cat={cat} onMode={mode} onSelect={select} onCat={findCat} />}
    <span className={`notice ${notice ? 'notice--visible' : ''}`} role="status">{notice}</span>
  </div>;
}

createRoot(document.getElementById('root')!).render(<App />);
