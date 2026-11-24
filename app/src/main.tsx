import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { asset, experiments, getZone, projects, stars, zones, type ZoneId } from './content';
import Icon, { type Glyph } from './icons';
import type { StationState } from './station';
import './styles.css';

type Mode = StationState['mode'];
type Route = Pick<StationState, 'mode' | 'zone' | 'focused'>;
const homeRoute: Route = { mode: 'explore', zone: 'core', focused: false };
const zoneIcons: Record<ZoneId, Glyph> = { core: 'spark', archive: 'archive', laboratory: 'lab', constellation: 'stars', unknown: 'signal' };

function readRoute(): Route {
  const [mode, zone] = location.hash.slice(1).split('/');
  if (mode !== 'explore' && mode !== 'browse') return homeRoute;
  const found = zones.find(item => item.id === zone);
  return { mode, zone: found?.id ?? 'core', focused: Boolean(found) };
}

function readCat() {
  try { return sessionStorage.getItem('catspace-signal') === 'found'; }
  catch { return false; }
}

function Station({ state, onFocus, onWake, onCat, children }: {
  state: StationState;
  onFocus: (id: ZoneId) => void;
  onWake: () => void;
  onCat: () => void;
  children: ReactNode;
}) {
  const host = useRef<HTMLDivElement>(null);
  const current = useRef(state);
  const [activated, setActivated] = useState(state.mode === 'explore');
  current.current = state;
  useEffect(() => { if (state.mode === 'explore') setActivated(true); }, [state.mode]);
  useEffect(() => {
    if (!activated || !host.current || typeof WebGL2RenderingContext === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      new URLSearchParams(location.search).has('still')) return;
    const holder = host.current;
    let cancelled = false;
    let unmount: (() => void) | undefined;
    const start = () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('webgl2', { alpha: true, antialias: false, powerPreference: 'high-performance' });
      if (!context) return;
      import('./station').then(({ mountStation }) => {
        if (cancelled) return;
        return mountStation(holder, context, () => current.current).then(dispose => {
          if (cancelled) dispose();
          else unmount = dispose;
        });
      }).catch(() => {
        const scene = holder.closest<HTMLElement>('.station');
        if (scene) scene.dataset.renderer = 'fallback';
      });
    };
    const timer = window.setTimeout(start, 60);
    return () => { cancelled = true; clearTimeout(timer); unmount?.(); };
  }, [activated]);

  return <main id="explore-main" className={`station ${state.focused ? 'station--focused' : ''}`} data-zone={state.zone}>
    <div className="station-visual" aria-hidden="true">
      <picture className="plate">
        <source media="(max-width: 740px)" srcSet={asset('observatory-mobile.webp')} />
        <img src={asset('observatory.webp')} alt="" fetchPriority="high" width="1672" height="941" />
      </picture>
      <img src={asset('nucleus.webp')} className="nucleus-fallback" alt="" width="760" height="694" />
      <div className="cat-fallback"><i /><b /><span /></div>
    </div>
    <div className="station-canvas" ref={host} />
    <div className="station-grade" />
    <span key={state.wake} className={state.wake ? 'wake-flash' : ''} aria-hidden="true" />
    <div className="station-markers">
      {zones.filter(zone => zone.id !== 'core').map(zone => <button
        key={zone.id} type="button" className={`marker marker--${zone.id}`} data-marker={zone.id}
        aria-label={`聚焦${zone.zh}`}
        style={{ '--px': `${zone.marker[0] * 100}%`, '--py': `${zone.marker[1] * 100}%` } as CSSProperties}
        onClick={() => onFocus(zone.id)}>
        <span className="marker-line" aria-hidden="true"><i /><b /></span>
        <span className="marker-body"><Icon name={zoneIcons[zone.id]} /><span><strong>{zone.zh}</strong><small>{zone.en}</small></span></span>
      </button>)}
      <button className="life-hit" data-marker="life" aria-label="唤醒数字生命" onClick={onWake} />
      <button className="marker marker--core" data-marker="core" onClick={onWake} aria-label="唤醒数字生命并查看核心">
        <span className="marker-line" aria-hidden="true"><i /><b /></span>
        <span className="marker-body"><Icon name="spark" /><span><strong>Nucleus</strong><small>数字生命</small></span></span>
      </button>
      <button className="cat-hit" data-marker="cat" aria-label="与观测站的小黑猫互动" onClick={onCat}><span>值班猫</span></button>
    </div>
    {children}
  </main>;
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
        <div className="browse-image" role="img" aria-label="环形观测站与窗外的星海"><img src={asset('observatory.webp')} alt="" width="1672" height="941" /><div><Icon name="orbit" /> CATSPACE OBSERVATORY</div></div>
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
      <footer className="browse-footer"><span><Icon name="orbit" /> CATSPACE</span><a href="http://home.zxxdm.cn/" target="_blank" rel="noopener noreferrer">原来的产品小屋 <Icon name="external" /></a></footer>
    </div>
  </main>;
}

function App() {
  const [route, setRoute] = useState(readRoute);
  const [wake, setWake] = useState(0);
  const [cat, setCat] = useState(readCat);
  const [notice, setNotice] = useState('');
  const [entered, setEntered] = useState(() => route.focused);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const details = useRef<HTMLElement>(null);
  const detailTrigger = useRef<HTMLElement | null>(null);
  const zone = getZone(route.zone);

  useEffect(() => {
    const sync = () => { const next = readRoute(); if (next.focused) setEntered(true); setRoute(next); };
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const motion = (event: MediaQueryListEvent) => setReduced(event.matches);
    mq.addEventListener('change', motion);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
      mq.removeEventListener('change', motion);
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 4300);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (route.mode === 'explore' && route.focused) details.current?.focus({ preventScroll: true });
  }, [route.mode, route.zone, route.focused]);

  function go(next: Route) {
    const hash = `#${next.mode}${next.focused ? '/' + next.zone : ''}`;
    if (location.hash !== hash) history.pushState(null, '', hash);
    setRoute(next);
    setMobileMenu(false);
  }

  function mode(next: Mode) {
    if (route.mode === next) return;
    if (next === 'explore') setEntered(true);
    go({ ...route, mode: next });
    if (!route.focused) window.scrollTo(0, 0);
  }

  function select(id: ZoneId) {
    if (!route.focused && document.activeElement instanceof HTMLElement) detailTrigger.current = document.activeElement;
    if (route.mode === 'explore') setEntered(true);
    go({ ...route, zone: id, focused: true });
  }

  function closeDetail() {
    go({ ...route, focused: false });
    requestAnimationFrame(() => detailTrigger.current?.focus());
  }

  function awaken() {
    setWake(value => value + 1);
    setNotice('数字生命已苏醒。');
    select('core');
  }

  function discoverCat() {
    try { sessionStorage.setItem('catspace-signal', 'found'); } catch { /* signal remains in memory */ }
    setCat(true);
    setNotice('你遇见了值班猫。发现一条新信号。');
    select('unknown');
  }

  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (mobileMenu) setMobileMenu(false);
      else if (route.mode === 'explore' && route.focused) closeDetail();
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  });

  return <div className={`app app--${route.mode}`}>
    <a className="skip" href={route.mode === 'explore' ? '#explore-main' : '#main'} onClick={event => { event.preventDefault(); const main = document.getElementById(route.mode === 'explore' ? 'explore-main' : 'main'); main?.setAttribute('tabindex', '-1'); main?.focus(); }}>跳至主要内容</a>
    <header className="top">
      <button className="brand" aria-label="CATSPACE 首页" onClick={() => { setEntered(false); go({ ...route, zone: 'core', focused: false }); window.scrollTo(0, 0); }}>
        <span className="brand-orbit"><Icon name="orbit" /></span><span className="brand-name">CATSPACE<small>THE LIVING UNIVERSE</small></span>
      </button>
      <nav className={`top-nav ${mobileMenu ? 'is-open' : ''}`} aria-label="主导航">
        <button aria-current={!route.focused ? 'page' : undefined} onClick={() => { setEntered(false); go({ ...route, zone: 'core', focused: false }); window.scrollTo(0, 0); }}>首页</button>
        <button aria-current={route.focused && route.zone === 'archive' ? 'page' : undefined} onClick={() => select('archive')}>作品</button>
        <button aria-current={route.focused && route.zone === 'laboratory' ? 'page' : undefined} onClick={() => select('laboratory')}>实验</button>
        <button aria-current={route.focused && route.zone === 'constellation' ? 'page' : undefined} onClick={() => select('constellation')}>星图</button>
        <button aria-current={route.focused && route.zone === 'core' ? 'page' : undefined} onClick={() => select('core')}>关于</button>
      </nav>
      <div className="top-actions">
        <button className="mode-toggle" onClick={() => mode(route.mode === 'explore' ? 'browse' : 'explore')}>
          <Icon name={route.mode === 'explore' ? 'grid' : 'enter'} /><span>{route.mode === 'explore' ? '浏览模式' : '探索模式'}</span>
        </button>
        <button className="menu-toggle" aria-label={mobileMenu ? '关闭菜单' : '打开菜单'} aria-expanded={mobileMenu} onClick={() => setMobileMenu(value => !value)}><Icon name={mobileMenu ? 'close' : 'menu'} /></button>
      </div>
    </header>

    <div hidden={route.mode !== 'explore'} className="explore-page">
      <Station state={{ ...route, wake, reduced }} onFocus={select} onWake={awaken} onCat={discoverCat}>
        {!route.focused && <section className="intro">
          <p className="micro"><span className="live-dot" /> 私人观测站 <span className="station-tag">/ OBSERVATORY</span></p>
          <h1>我的<br />数字宇宙<span>.</span></h1>
          <p className="intro-text">我是脏兮兮的猫。这里收藏我的作品、AI 实验和一点好奇心。</p>
          <div className="intro-actions">
            <button className="action action--primary" onClick={() => {
              if (entered) awaken();
              else select('core');
            }}><Icon name={entered ? 'spark' : 'enter'} /> {entered ? '唤醒数字生命' : '进入观测站'}<Icon className="action-trail" name="arrow" /></button>
            <button className="action action--outline" onClick={() => mode('browse')}><Icon name="grid" /> 日常浏览</button>
          </div>
        </section>}
        {route.focused && <aside key={zone.id} className="zone-detail" tabIndex={-1} ref={details} aria-labelledby="zone-title">
          <div className="detail-top"><span className="micro"><Icon name={zoneIcons[zone.id]} /> {zone.en}</span><button className="close" aria-label="返回观测大厅" onClick={closeDetail}><Icon name="close" /></button></div>
          <h2 id="zone-title">{zone.zh}</h2><p className="detail-summary">{zone.summary}</p>
          <ZoneContent id={zone.id} cat={cat} onSelect={select} />
          <button className="text-link detail-mode" onClick={zone.id === 'core' ? awaken : () => mode('browse')}>
            <Icon name={zone.id === 'core' ? 'spark' : 'grid'} /> {zone.id === 'core' ? '唤醒生命体' : '在浏览模式中打开'}
          </button>
        </aside>}
        <div className="station-footer">
          <div className="station-place"><Icon name="orbit" /><span><strong>中央观测厅</strong><small>CATSPACE OBSERVATORY</small></span></div>
          <nav className="dock" aria-label="空间导航">
            {zones.map(item => <button key={item.id} aria-pressed={item.id === zone.id} onClick={() => select(item.id)}><Icon name={zoneIcons[item.id]} /><span>{item.nav}</span></button>)}
          </nav>
          <button className="station-signal" aria-label="查看观测站信号" onClick={() => select('unknown')}><span><i className="live-dot" /> {cat ? '新信号已接收' : '观测站在线'}</span><Icon name="signal" /></button>
        </div>
      </Station>
    </div>
    {route.mode === 'browse' && <Browse route={route} cat={cat} onMode={mode} onSelect={select} onCat={discoverCat} />}
    <span className={`notice ${notice ? 'notice--visible' : ''}`} role="status">{notice}</span>
  </div>;
}

createRoot(document.getElementById('root')!).render(<App />);
