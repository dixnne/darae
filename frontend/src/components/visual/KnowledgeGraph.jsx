import { useEffect, useRef, useState } from 'react';
import { Share2 } from 'lucide-react';

function KnowledgeGraph({ notes, resources, onNodeClick }) {
  const canvasRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [hoveredNode, setHoveredNode] = useState(null);
  const dragNode = useRef(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const newNodes = [];
    const newLinks = [];

    notes.forEach(note => {
      const id = `note-${note.id}`;
      newNodes.push({ id, label: note.title, type: 'note', x: Math.random() * 800, y: Math.random() * 600, vx: 0, vy: 0 });
    });

    resources.vocabulary.forEach(v => {
      const id = `vocab-${v.id}`;
      newNodes.push({ id, label: v.surface_form, type: 'vocab', x: Math.random() * 800, y: Math.random() * 600, vx: 0, vy: 0 });
      notes.forEach(note => {
        if (note.vocab_rel?.some(rv => rv.id === v.id)) newLinks.push({ source: `note-${note.id}`, target: id });
      });
    });

    resources.grammar.forEach(g => {
      const id = `grammar-${g.id}`;
      newNodes.push({ id, label: g.name, type: 'grammar', x: Math.random() * 800, y: Math.random() * 600, vx: 0, vy: 0 });
      notes.forEach(note => {
        if (note.grammar_rel?.some(rg => rg.id === g.id)) newLinks.push({ source: `note-${note.id}`, target: id });
      });
    });

    resources.expressions.forEach(e => {
      const id = `expr-${e.id}`;
      newNodes.push({ id, label: e.text, type: 'expr', x: Math.random() * 800, y: Math.random() * 600, vx: 0, vy: 0 });
      notes.forEach(note => {
        if (note.expression_rel?.some(re => re.id === e.id)) newLinks.push({ source: `note-${note.id}`, target: id });
      });
    });

    setNodes(newNodes);
    setLinks(newLinks);
  }, [notes, resources]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const simulate = () => {
      const repulsion = 0.5, attraction = 0.02, centerForce = 0.01, friction = 0.9;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x, dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 300) {
            const force = repulsion / (dist * 0.01);
            nodes[i].vx -= (dx / dist) * force; nodes[i].vy -= (dy / dist) * force;
            nodes[j].vx += (dx / dist) * force; nodes[j].vy += (dy / dist) * force;
          }
        }
      }
      links.forEach(link => {
        const s = nodes.find(n => n.id === link.source), t = nodes.find(n => n.id === link.target);
        if (s && t) {
          const dx = t.x - s.x, dy = t.y - s.y, dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - 100) * attraction;
          s.vx += (dx / dist) * force; s.vy += (dy / dist) * force;
          t.vx -= (dx / dist) * force; t.vy -= (dy / dist) * force;
        }
      });
      const cx = canvas.width / 2, cy = canvas.height / 2;
      nodes.forEach(n => {
        if (n === dragNode.current) return;
        n.vx += (cx - n.x) * centerForce; n.vy += (cy - n.y) * centerForce;
        n.vx *= friction; n.vy *= friction; n.x += n.vx; n.y += n.vy;
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const colors = {
        note: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(),
        vocab: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
        grammar: getComputedStyle(document.documentElement).getPropertyValue('--secondary').trim(),
        expr: '#fbbf24'
      };

      ctx.beginPath(); ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
      links.forEach(l => {
        const s = nodes.find(n => n.id === l.source), t = nodes.find(n => n.id === l.target);
        if (s && t) { ctx.moveTo(s.x, s.y); ctx.lineTo(t.x, t.y); }
      });
      ctx.stroke();

      nodes.forEach(n => {
        const isH = hoveredNode === n; ctx.beginPath();
        let r = n.type === 'note' ? 12 : 8; if (isH) r += 4;
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.fillStyle = colors[n.type] || '#ccc';
        ctx.shadowBlur = isH ? 15 : 5; ctx.shadowColor = ctx.fillStyle; ctx.fill(); ctx.shadowBlur = 0;
        if (isH || n.type === 'note') {
          ctx.fillStyle = '#1e293b'; ctx.font = isH ? 'bold 12px Inter' : '10px Inter';
          ctx.textAlign = 'center'; ctx.fillText(n.label || '...', n.x, n.y + r + 15);
        }
      });
      simulate(); animationId = requestAnimationFrame(draw);
    };
    draw(); return () => cancelAnimationFrame(animationId);
  }, [nodes, links, hoveredNode]);

  const handleMouseMove = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (dragNode.current) { dragNode.current.x = x; dragNode.current.y = y; return; }
    const f = nodes.find(n => Math.sqrt((n.x - x)**2 + (n.y - y)**2) < 25);
    setHoveredNode(f || null);
    canvasRef.current.style.cursor = f ? 'pointer' : 'crosshair';
  };

  const handleMouseDown = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    lastMousePos.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    if (hoveredNode) dragNode.current = hoveredNode;
  };

  const handleMouseUp = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const d = Math.sqrt((x - lastMousePos.current.x)**2 + (y - lastMousePos.current.y)**2);
    if (hoveredNode && d < 5 && onNodeClick) onNodeClick(hoveredNode);
    dragNode.current = null;
  };

  return (
    <div className="w-full h-full relative bg-white rounded-[3rem] border border-slate-100 shadow-inner overflow-hidden">
      <canvas ref={canvasRef} width={1000} height={800} className="w-full h-full" onMouseMove={handleMouseMove} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} />
      <div className="absolute top-8 left-8 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-100 shadow-sm pointer-events-none">
        <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2"><Share2 size={14}/> Leyenda</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase"><div className="w-3 h-3 rounded-full bg-[var(--primary)]" /> Notas</div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase"><div className="w-3 h-3 rounded-full bg-[var(--accent)]" /> Vocabulario</div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase"><div className="w-3 h-3 rounded-full bg-[var(--secondary)]" /> Gramática</div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase"><div className="w-3 h-3 rounded-full bg-amber-400" /> Expresiones</div>
        </div>
      </div>
    </div>
  );
}

export default KnowledgeGraph;