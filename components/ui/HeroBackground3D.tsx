"use client";

import { useEffect, useRef, useCallback } from "react";
import { useTheme } from "./ThemeProvider";

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  opacity: number;
  color: string;
  type: "circle" | "diamond" | "ring";
}

interface FloatingShape {
  x: number;
  y: number;
  z: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  vRotX: number;
  vRotY: number;
  vRotZ: number;
  vy: number;
  size: number;
  opacity: number;
  type: "cube" | "pyramid" | "octahedron" | "torus";
}

interface GridLine {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  opacity: number;
  phase: number;
}

export function HeroBackground3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const { theme } = useTheme();

  const draw = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    particles: Particle[],
    shapes: FloatingShape[],
    gridLines: GridLine[],
    time: number,
    isDark: boolean
  ) => {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Background gradient
    const bgGrad = ctx.createRadialGradient(
      width * 0.5, height * 0.4, 0,
      width * 0.5, height * 0.4, width * 0.8
    );
    
    if (isDark) {
      bgGrad.addColorStop(0, "rgba(20, 15, 5, 0.95)");
      bgGrad.addColorStop(0.5, "rgba(10, 10, 10, 0.98)");
      bgGrad.addColorStop(1, "rgba(5, 5, 5, 1)");
    } else {
      bgGrad.addColorStop(0, "rgba(255, 250, 235, 0.95)");
      bgGrad.addColorStop(0.3, "rgba(250, 249, 246, 0.97)");
      bgGrad.addColorStop(0.7, "rgba(250, 249, 246, 0.99)");
      bgGrad.addColorStop(1, "rgba(250, 249, 246, 1)");
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Gold nebula glow
    const nebulaX = width * 0.5 + Math.sin(time * 0.0003) * width * 0.1;
    const nebulaY = height * 0.35 + Math.cos(time * 0.0004) * height * 0.05;
    const nebulaGrad = ctx.createRadialGradient(nebulaX, nebulaY, 0, nebulaX, nebulaY, width * 0.4);
    
    if (isDark) {
      nebulaGrad.addColorStop(0, "rgba(212, 175, 55, 0.06)");
      nebulaGrad.addColorStop(0.4, "rgba(212, 175, 55, 0.02)");
      nebulaGrad.addColorStop(1, "rgba(212, 175, 55, 0)");
    } else {
      nebulaGrad.addColorStop(0, "rgba(200, 165, 45, 0.12)");
      nebulaGrad.addColorStop(0.3, "rgba(200, 165, 45, 0.06)");
      nebulaGrad.addColorStop(0.6, "rgba(200, 165, 45, 0.02)");
      nebulaGrad.addColorStop(1, "rgba(200, 165, 45, 0)");
    }
    ctx.fillStyle = nebulaGrad;
    ctx.fillRect(0, 0, width, height);

    // Second nebula
    const neb2X = width * 0.7 + Math.cos(time * 0.0002) * width * 0.1;
    const neb2Y = height * 0.6 + Math.sin(time * 0.0003) * height * 0.08;
    const neb2Grad = ctx.createRadialGradient(neb2X, neb2Y, 0, neb2X, neb2Y, width * 0.3);
    if (isDark) {
      neb2Grad.addColorStop(0, "rgba(180, 140, 30, 0.03)");
      neb2Grad.addColorStop(1, "rgba(180, 140, 30, 0)");
    } else {
      neb2Grad.addColorStop(0, "rgba(180, 140, 30, 0.07)");
      neb2Grad.addColorStop(0.5, "rgba(180, 140, 30, 0.03)");
      neb2Grad.addColorStop(1, "rgba(180, 140, 30, 0)");
    }
    ctx.fillStyle = neb2Grad;
    ctx.fillRect(0, 0, width, height);

    // Draw grid (perspective floor effect)
    const gridColor = isDark ? "rgba(212, 175, 55, " : "rgba(160, 130, 30, ";
    const perspectiveY = height * 0.75;
    const vanishX = width * 0.5;
    
    // Horizontal grid lines
    for (let i = 0; i < 12; i++) {
      const yPos = perspectiveY + i * (height * 0.025) * (1 + i * 0.3);
      if (yPos > height) continue;
      const fade = Math.max(0, 1 - i / 12);
      const pulse = 0.5 + 0.5 * Math.sin(time * 0.001 + i * 0.5);
      const lineOpacity = fade * 0.06 * (0.7 + pulse * 0.3);
      
      ctx.beginPath();
      ctx.moveTo(0, yPos);
      ctx.lineTo(width, yPos);
      ctx.strokeStyle = gridColor + lineOpacity + ")";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    // Vertical converging grid lines
    for (let i = -8; i <= 8; i++) {
      const baseX = vanishX + i * width * 0.08;
      const endX = vanishX + i * width * 0.35;
      const fade = Math.max(0, 1 - Math.abs(i) / 8);
      const pulse = 0.5 + 0.5 * Math.sin(time * 0.0008 + i * 0.3);
      const lineOpacity = fade * 0.05 * (0.7 + pulse * 0.3);
      
      ctx.beginPath();
      ctx.moveTo(baseX, perspectiveY);
      ctx.lineTo(endX, height);
      ctx.strokeStyle = gridColor + lineOpacity + ")";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw particles with 3D perspective
    const centerX = width / 2;
    const centerY = height / 2;
    const fov = 500;

    particles.forEach((p) => {
      // 3D to 2D projection
      const scale = fov / (fov + p.z);
      const x2d = centerX + (p.x - centerX) * scale;
      const y2d = centerY + (p.y - centerY) * scale;
      const r = p.size * scale;

      // Mouse parallax
      const mx = (mouseRef.current.x - centerX) * 0.02 * scale;
      const my = (mouseRef.current.y - centerY) * 0.02 * scale;

      const finalX = x2d + mx;
      const finalY = y2d + my;

      ctx.save();
      ctx.globalAlpha = p.opacity * scale;

      if (p.type === "circle") {
        const grad = ctx.createRadialGradient(finalX, finalY, 0, finalX, finalY, r * 3);
        grad.addColorStop(0, p.color);
        grad.addColorStop(0.5, p.color.replace(/[\d.]+\)$/, "0.3)"));
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(finalX, finalY, r * 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === "diamond") {
        ctx.fillStyle = p.color;
        ctx.translate(finalX, finalY);
        ctx.rotate(time * 0.001);
        ctx.beginPath();
        ctx.moveTo(0, -r * 2);
        ctx.lineTo(r * 1.5, 0);
        ctx.lineTo(0, r * 2);
        ctx.lineTo(-r * 1.5, 0);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(finalX, finalY, r * 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();

      // Update position
      p.x += p.vx;
      p.y += p.vy;
      p.z += p.vz;

      if (p.x < -50 || p.x > width + 50) p.vx *= -1;
      if (p.y < -50 || p.y > height + 50) p.vy *= -1;
      if (p.z < -200 || p.z > 800) p.vz *= -1;
    });

    // Draw connections between close particles
    const connectionColor = isDark ? "212, 175, 55" : "160, 130, 30";
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 200) {
          const opacity = (1 - dist / 200) * 0.08;
          const scaleI = fov / (fov + particles[i].z);
          const scaleJ = fov / (fov + particles[j].z);
          const x1 = centerX + (particles[i].x - centerX) * scaleI;
          const y1 = centerY + (particles[i].y - centerY) * scaleI;
          const x2 = centerX + (particles[j].x - centerX) * scaleJ;
          const y2 = centerY + (particles[j].y - centerY) * scaleJ;
          
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = `rgba(${connectionColor}, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // Draw 3D floating shapes
    shapes.forEach((shape) => {
      const scale = fov / (fov + shape.z);
      const x2d = centerX + (shape.x - centerX) * scale;
      const y2d = centerY + (shape.y - centerY) * scale;
      const s = shape.size * scale;
      
      const mx = (mouseRef.current.x - centerX) * 0.03 * scale;
      const my = (mouseRef.current.y - centerY) * 0.03 * scale;
      
      ctx.save();
      ctx.globalAlpha = shape.opacity * scale * 0.8;
      ctx.translate(x2d + mx, y2d + my);
      ctx.rotate(shape.rotZ);
      
      const strokeColor = isDark
        ? `rgba(212, 175, 55, ${0.15 + Math.sin(time * 0.001 + shape.rotX) * 0.1})`
        : `rgba(160, 122, 20, ${0.2 + Math.sin(time * 0.001 + shape.rotX) * 0.12})`;
      const fillColor = isDark
        ? `rgba(212, 175, 55, ${0.02 + Math.sin(time * 0.0015 + shape.rotY) * 0.02})`
        : `rgba(160, 122, 20, ${0.04 + Math.sin(time * 0.0015 + shape.rotY) * 0.03})`;

      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = fillColor;
      ctx.lineWidth = 1;

      if (shape.type === "cube") {
        // Draw a wireframe cube
        const hs = s;
        const depth = hs * 0.6;
        const skewX = Math.sin(shape.rotY) * depth;
        const skewY = Math.cos(shape.rotX) * depth * 0.5;
        
        // Front face
        ctx.beginPath();
        ctx.rect(-hs, -hs, hs * 2, hs * 2);
        ctx.stroke();
        ctx.fill();
        
        // Back face edges
        ctx.beginPath();
        ctx.moveTo(-hs, -hs); ctx.lineTo(-hs + skewX, -hs - skewY);
        ctx.moveTo(hs, -hs); ctx.lineTo(hs + skewX, -hs - skewY);
        ctx.moveTo(hs, hs); ctx.lineTo(hs + skewX, hs - skewY);
        ctx.moveTo(-hs, hs); ctx.lineTo(-hs + skewX, hs - skewY);
        ctx.stroke();
        
        // Back face
        ctx.beginPath();
        ctx.moveTo(-hs + skewX, -hs - skewY);
        ctx.lineTo(hs + skewX, -hs - skewY);
        ctx.lineTo(hs + skewX, hs - skewY);
        ctx.lineTo(-hs + skewX, hs - skewY);
        ctx.closePath();
        ctx.stroke();
      } else if (shape.type === "pyramid") {
        const topY = -s * 1.2;
        ctx.beginPath();
        ctx.moveTo(0, topY);
        ctx.lineTo(-s, s * 0.8);
        ctx.lineTo(s, s * 0.8);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        
        // Side edge
        ctx.beginPath();
        ctx.moveTo(0, topY);
        ctx.lineTo(s * 0.3, s * 0.4);
        ctx.stroke();
      } else if (shape.type === "octahedron") {
        const points = [
          [0, -s * 1.5], [s, 0], [0, s * 1.5], [-s, 0]
        ];
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i][0], points[i][1]);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        
        // Internal lines
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        ctx.lineTo(points[2][0], points[2][1]);
        ctx.moveTo(points[1][0], points[1][1]);
        ctx.lineTo(points[3][0], points[3][1]);
        ctx.stroke();
      } else {
        // Torus-like ring
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 1.5, s * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 1.2, s * 0.3, Math.PI * 0.15, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();

      // Animate shape
      shape.rotX += shape.vRotX;
      shape.rotY += shape.vRotY;
      shape.rotZ += shape.vRotZ;
      shape.y += shape.vy;
      shape.x += Math.sin(time * 0.0005 + shape.rotX) * 0.3;

      if (shape.y < -100) {
        shape.y = height + 100;
        shape.x = Math.random() * width;
      }
      if (shape.y > height + 100) {
        shape.y = -100;
        shape.x = Math.random() * width;
      }
    });

    // Floating gold dust — tiny sparkles
    for (let i = 0; i < 30; i++) {
      const sx = (Math.sin(time * 0.001 + i * 137.5) * 0.5 + 0.5) * width;
      const sy = (Math.cos(time * 0.0008 + i * 97.3) * 0.5 + 0.5) * height;
      const sparkleSize = 1 + Math.sin(time * 0.003 + i * 50) * 0.5;
      const sparkleOpacity = 0.1 + Math.sin(time * 0.002 + i * 73) * 0.1;
      
      if (sparkleOpacity > 0) {
        ctx.save();
        ctx.globalAlpha = sparkleOpacity;
        ctx.fillStyle = isDark ? "#D4AF37" : "#B8941E";
        ctx.beginPath();
        ctx.arc(sx, sy, sparkleSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const isDark = theme === "dark";

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Create particles
    const particles: Particle[] = [];
    const particleCount = Math.min(60, Math.floor(width * height / 25000));
    const goldColors = isDark 
      ? [
          "rgba(212, 175, 55, 0.6)",
          "rgba(232, 204, 106, 0.4)",
          "rgba(180, 140, 30, 0.5)",
          "rgba(255, 215, 0, 0.3)",
        ]
      : [
          "rgba(180, 140, 30, 0.5)",
          "rgba(160, 130, 30, 0.3)",
          "rgba(140, 110, 20, 0.4)",
          "rgba(200, 160, 40, 0.25)",
        ];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 600,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.3,
        vz: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.2,
        color: goldColors[Math.floor(Math.random() * goldColors.length)],
        type: ["circle", "diamond", "ring"][Math.floor(Math.random() * 3)] as Particle["type"],
      });
    }

    // Create floating 3D shapes
    const shapes: FloatingShape[] = [];
    const shapeCount = Math.min(8, Math.floor(width / 200));
    const shapeTypes: FloatingShape["type"][] = ["cube", "pyramid", "octahedron", "torus"];
    
    for (let i = 0; i < shapeCount; i++) {
      shapes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 400 + 100,
        rotX: Math.random() * Math.PI * 2,
        rotY: Math.random() * Math.PI * 2,
        rotZ: Math.random() * Math.PI * 2,
        vRotX: (Math.random() - 0.5) * 0.005,
        vRotY: (Math.random() - 0.5) * 0.005,
        vRotZ: (Math.random() - 0.5) * 0.008,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 20 + 15,
        opacity: Math.random() * 0.3 + 0.15,
        type: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
      });
    }

    const gridLines: GridLine[] = [];

    const handleMouse = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    window.addEventListener("mousemove", handleMouse);

    let time = 0;
    const animate = () => {
      time += 16;
      draw(ctx, window.innerWidth, window.innerHeight, particles, shapes, gridLines, time, isDark);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [theme, draw]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 -z-10"
      style={{ pointerEvents: "none" }}
    />
  );
}
// creado por pato dev y askforvini
