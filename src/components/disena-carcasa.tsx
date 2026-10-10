"use client";

import { useEffect, useRef, useState } from "react";
import { IconWhatsApp } from "@/components/icons";
import { whatsappUrl } from "@/lib/format";
import { guardarVariante, useVarianteGuardada } from "@/lib/variante-guardada";

/** Contorno imprimible de la plantilla de sublimación (en puntos) y alto del cuerpo del teléfono. */
type Contorno = { x: number; y: number; w: number; h: number; alto: number; d: string };
type Variante = { id: number; nombre: string; slug: string };
type Modelo = { nombre: string; slug: string; variantes: Variante[] };
/** zoom 1 = la foto cubre justo el contorno; dx/dy = desplazamiento del centro, en puntos. */
type Vista = { zoom: number; dx: number; dy: number };
type Foto = { fuente: HTMLCanvasElement | HTMLImageElement; ancho: number; alto: number };

const VISTA_INICIAL: Vista = { zoom: 1, dx: 0, dy: 0 };
const ZOOM_MAX = 4;
const LADO_MAX_FOTO = 2000; // px: más que suficiente para la vista previa y liviano en el celular
const ANCHO_VISTA = 280; // px en pantalla
const ALTO_IMAGEN = 1400; // px de la imagen que se comparte

/** Mantiene la foto cubriendo todo el contorno (sin bordes vacíos). */
function limitar(v: Vista, c: Contorno, f: Foto): Vista {
  const zoom = Math.min(ZOOM_MAX, Math.max(1, v.zoom));
  const s = Math.max(c.w / f.ancho, c.h / f.alto) * zoom;
  const libreX = Math.max(0, (f.ancho * s - c.w) / 2);
  const libreY = Math.max(0, (f.alto * s - c.h) / 2);
  return {
    zoom,
    dx: Math.min(libreX, Math.max(-libreX, v.dx)),
    dy: Math.min(libreY, Math.max(-libreY, v.dy)),
  };
}

/** Caja que se dibuja: el cuerpo del teléfono con un margen alrededor (en puntos). */
function marco(c: Contorno) {
  const margen = c.w * 0.06;
  const cuerpoY = c.y + c.h - c.alto;
  return { margen, cuerpoY, ancho: c.w + margen * 2, alto: c.alto + margen * 2 };
}

/** Dibuja la carcasa con la foto. k = píxeles por punto. */
function dibujar(ctx: CanvasRenderingContext2D, c: Contorno, foto: Foto | null, v: Vista, k: number) {
  const { margen, cuerpoY } = marco(c);
  ctx.setTransform(k, 0, 0, k, (margen - c.x) * k, (margen - cuerpoY) * k);

  // Cuerpo de la carcasa (se ve en el hueco de la cámara y en el borde).
  ctx.beginPath();
  ctx.roundRect(c.x, cuerpoY, c.w, c.alto, c.w * 0.17);
  ctx.fillStyle = "#23201d";
  ctx.fill();

  const contorno = new Path2D(c.d);
  ctx.save();
  ctx.clip(contorno);
  ctx.fillStyle = "#f6f4f0";
  ctx.fillRect(c.x, c.y, c.w, c.h);
  if (foto) {
    const s = Math.max(c.w / foto.ancho, c.h / foto.alto) * v.zoom;
    const w = foto.ancho * s;
    const h = foto.alto * s;
    ctx.drawImage(foto.fuente, c.x + c.w / 2 + v.dx - w / 2, c.y + c.h / 2 + v.dy - h / 2, w, h);
  }
  ctx.restore();

  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.stroke(contorno);
}

/** Lee la foto elegida y la achica si es muy grande. */
async function cargarFoto(archivo: File): Promise<Foto> {
  const url = URL.createObjectURL(archivo);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const escala = Math.min(1, LADO_MAX_FOTO / Math.max(img.naturalWidth, img.naturalHeight));
    const ancho = Math.round(img.naturalWidth * escala);
    const alto = Math.round(img.naturalHeight * escala);
    const lienzo = document.createElement("canvas");
    lienzo.width = ancho;
    lienzo.height = alto;
    lienzo.getContext("2d")!.drawImage(img, 0, 0, ancho, alto);
    return { fuente: lienzo, ancho, alto };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Imagen para compartir: la carcasa sobre fondo claro con el nombre del modelo. */
async function crearImagen(c: Contorno, foto: Foto, v: Vista, modelo: string): Promise<File> {
  const { ancho, alto } = marco(c);
  const pie = 90;
  const k = (ALTO_IMAGEN - pie) / alto;
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.round(ancho * k);
  lienzo.height = ALTO_IMAGEN;
  const ctx = lienzo.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, lienzo.width, lienzo.height);
  dibujar(ctx, c, foto, v, k);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#23201d";
  ctx.textAlign = "center";
  ctx.font = "600 34px system-ui, sans-serif";
  ctx.fillText(`${modelo} · Casemood`, lienzo.width / 2, ALTO_IMAGEN - pie / 2 + 12);
  const blob = await new Promise<Blob | null>((ok) => lienzo.toBlob(ok, "image/jpeg", 0.9));
  if (!blob) throw new Error("No se pudo crear la imagen");
  return new File([blob], `carcasa-${modelo.toLowerCase().replace(/\s+/g, "-")}.jpg`, { type: "image/jpeg" });
}

export function DisenaCarcasa({ modelos, whatsapp }: { modelos: Modelo[]; whatsapp: string }) {
  const guardada = useVarianteGuardada();
  const variantes = modelos.flatMap((m) => m.variantes.map((v) => ({ ...v, modeloSlug: m.slug })));
  const [elegida, setElegida] = useState<string | null>(null);
  // Si el visitante ya eligió su iPhone en la tienda, viene seleccionado.
  const slug = elegida ?? (variantes.some((v) => v.slug === guardada?.varianteSlug) ? guardada!.varianteSlug : "");
  const variante = variantes.find((v) => v.slug === slug);

  const [contornos, setContornos] = useState<Record<string, Contorno>>({});
  const contorno = slug ? contornos[slug] : undefined;
  const [errorContorno, setErrorContorno] = useState(false);
  const [foto, setFoto] = useState<Foto | null>(null);
  const [cargandoFoto, setCargandoFoto] = useState(false);
  const [errorFoto, setErrorFoto] = useState("");
  const [vista, setVista] = useState<Vista>(VISTA_INICIAL);
  const [aviso, setAviso] = useState("");
  const [compartiendo, setCompartiendo] = useState(false);

  const lienzoRef = useRef<HTMLCanvasElement>(null);
  const punteros = useRef(new Map<number, { x: number; y: number }>());
  const archivoRef = useRef<File | null>(null);

  // Contorno del modelo elegido (archivos estáticos de public/carcasas).
  useEffect(() => {
    if (!slug || contornos[slug]) return;
    let vigente = true;
    fetch(`/carcasas/${slug}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<Contorno>) : Promise.reject(new Error(String(r.status)))))
      .then((c) => vigente && setContornos((prev) => ({ ...prev, [slug]: c })))
      .catch(() => vigente && setErrorContorno(true));
    return () => {
      vigente = false;
    };
  }, [slug, contornos]);

  // Vista previa en pantalla.
  useEffect(() => {
    const lienzo = lienzoRef.current;
    if (!lienzo || !contorno) return;
    const { ancho, alto } = marco(contorno);
    const dpr = window.devicePixelRatio || 1;
    const k = (ANCHO_VISTA * dpr) / ancho;
    lienzo.width = Math.round(ancho * k);
    lienzo.height = Math.round(alto * k);
    dibujar(lienzo.getContext("2d")!, contorno, foto, vista, k);
  }, [contorno, foto, vista]);

  // La imagen para compartir se prepara de antemano: así el botón abre el menú de compartir al instante.
  useEffect(() => {
    archivoRef.current = null;
    if (!contorno || !foto || !variante) return;
    let vigente = true;
    const t = setTimeout(() => {
      crearImagen(contorno, foto, vista, variante.nombre).then((f) => {
        if (vigente) archivoRef.current = f;
      });
    }, 250);
    return () => {
      vigente = false;
      clearTimeout(t);
    };
  }, [contorno, foto, vista, variante]);

  function elegirVariante(nuevo: string) {
    setElegida(nuevo);
    setErrorContorno(false);
    setVista(VISTA_INICIAL);
    setAviso("");
    const v = variantes.find((x) => x.slug === nuevo);
    if (v) guardarVariante({ id: v.id, nombre: v.nombre, modeloSlug: v.modeloSlug, varianteSlug: v.slug });
  }

  async function elegirFoto(archivo: File | undefined) {
    if (!archivo) return;
    setErrorFoto("");
    setAviso("");
    if (!archivo.type.startsWith("image/")) {
      setErrorFoto("Ese archivo no es una foto. Elige una imagen JPG o PNG.");
      return;
    }
    setCargandoFoto(true);
    try {
      setFoto(await cargarFoto(archivo));
      setVista(VISTA_INICIAL);
    } catch {
      setErrorFoto("No pudimos abrir esa foto. Prueba con otra (JPG o PNG).");
    } finally {
      setCargandoFoto(false);
    }
  }

  function mover(cambio: (v: Vista) => Vista) {
    if (!contorno || !foto) return;
    setVista((v) => limitar(cambio(v), contorno, foto));
  }

  // Arrastrar con un dedo (o el mouse) y pellizcar con dos para acercar.
  function puntosPorPixel() {
    const lienzo = lienzoRef.current;
    return contorno && lienzo ? marco(contorno).ancho / lienzo.getBoundingClientRect().width : 1;
  }
  function alPresionar(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!foto) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    punteros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }
  function alMover(e: React.PointerEvent<HTMLCanvasElement>) {
    const anterior = punteros.current.get(e.pointerId);
    if (!anterior) return;
    const lista = [...punteros.current.entries()];
    if (lista.length === 1) {
      const f = puntosPorPixel();
      mover((v) => ({ ...v, dx: v.dx + (e.clientX - anterior.x) * f, dy: v.dy + (e.clientY - anterior.y) * f }));
    } else if (lista.length === 2) {
      const otro = lista.find(([id]) => id !== e.pointerId)![1];
      const antes = Math.hypot(anterior.x - otro.x, anterior.y - otro.y);
      const ahora = Math.hypot(e.clientX - otro.x, e.clientY - otro.y);
      if (antes > 0) mover((v) => ({ ...v, zoom: v.zoom * (ahora / antes) }));
    }
    punteros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }
  function alSoltar(e: React.PointerEvent<HTMLCanvasElement>) {
    punteros.current.delete(e.pointerId);
  }

  const mensaje = `Hola Casemood, quiero una carcasa personalizada para ${variante?.nombre ?? "mi iPhone"}. Te envío la vista previa de mi diseño y la foto original.`;

  async function compartir() {
    if (!contorno || !foto || !variante) return;
    setAviso("");
    setCompartiendo(true);
    try {
      const archivo = archivoRef.current ?? (await crearImagen(contorno, foto, vista, variante.nombre));
      const datos = { files: [archivo], text: mensaje };
      if (navigator.canShare?.(datos)) {
        try {
          await navigator.share(datos);
        } catch (e) {
          if ((e as Error).name !== "AbortError") throw e;
        }
        return;
      }
      // Sin menú de compartir (ej. computador): se descarga la imagen para adjuntarla en WhatsApp.
      const url = URL.createObjectURL(archivo);
      const a = document.createElement("a");
      a.href = url;
      a.download = archivo.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setAviso("Descargamos tu diseño. Ábrelo en el chat de WhatsApp con el botón de abajo y adjunta la imagen.");
    } catch {
      setAviso("No pudimos compartir la imagen. Haz una captura de pantalla y envíanosla por WhatsApp.");
    } finally {
      setCompartiendo(false);
    }
  }

  const paso = "font-display text-2xl font-bold";
  const boton =
    "flex min-h-12 items-center justify-center rounded-xl border-2 border-line bg-white px-4 text-base font-semibold text-ink active:bg-surface";

  return (
    <div className="space-y-8">
      <section aria-labelledby="paso-modelo">
        <h2 id="paso-modelo" className={paso}>
          1. ¿Qué iPhone tienes?
        </h2>
        <select
          aria-labelledby="paso-modelo"
          value={slug}
          onChange={(e) => elegirVariante(e.target.value)}
          className="mt-3 min-h-12 w-full rounded-xl border-2 border-line bg-white px-3 text-lg focus:border-brand focus:outline-none"
        >
          <option value="">Elige tu modelo</option>
          {modelos.map((m) => (
            <optgroup key={m.slug} label={m.nombre}>
              {m.variantes.map((v) => (
                <option key={v.slug} value={v.slug}>
                  {v.nombre}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {errorContorno && (
          <p role="alert" className="mt-2 text-base text-danger">
            No pudimos cargar ese modelo. Revisa tu conexión y vuelve a elegirlo.
          </p>
        )}
      </section>

      <section aria-labelledby="paso-foto">
        <h2 id="paso-foto" className={paso}>
          2. Sube tu foto
        </h2>
        <input
          id="foto-carcasa"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            elegirFoto(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <label
          htmlFor="foto-carcasa"
          className="mt-3 flex min-h-14 w-full cursor-pointer items-center justify-center rounded-2xl bg-brand px-4 text-lg font-bold text-white shadow-md active:brightness-95"
        >
          {cargandoFoto ? "Abriendo foto…" : foto ? "Cambiar foto" : "Elegir foto"}
        </label>
        {errorFoto && (
          <p role="alert" className="mt-2 text-base text-danger">
            {errorFoto}
          </p>
        )}
      </section>

      <section aria-labelledby="paso-ajuste">
        <h2 id="paso-ajuste" className={paso}>
          3. Así quedaría
        </h2>
        {contorno ? (
          <>
            <p className="mt-1 text-base text-ink-soft">
              {foto
                ? "Arrastra la foto para moverla. Pellizca o usa la barra para agrandarla."
                : "Sube una foto para verla en tu carcasa."}
            </p>
            <div className="mt-4 flex justify-center">
              <canvas
                ref={lienzoRef}
                role="img"
                aria-label={`Vista previa de la carcasa para ${variante?.nombre ?? "tu iPhone"}`}
                onPointerDown={alPresionar}
                onPointerMove={alMover}
                onPointerUp={alSoltar}
                onPointerCancel={alSoltar}
                style={{ width: ANCHO_VISTA, touchAction: foto ? "none" : "auto" }}
                className={`max-w-full ${foto ? "cursor-grab active:cursor-grabbing" : ""}`}
              />
            </div>
            {foto && (
              <div className="mt-4 space-y-3">
                <label className="block text-base font-semibold">
                  Tamaño de la foto
                  <input
                    type="range"
                    min={1}
                    max={ZOOM_MAX}
                    step={0.01}
                    value={vista.zoom}
                    onChange={(e) => mover((v) => ({ ...v, zoom: Number(e.target.value) }))}
                    className="mt-2 h-12 w-full accent-brand"
                  />
                </label>
                <button type="button" onClick={() => setVista(VISTA_INICIAL)} className={`${boton} w-full`}>
                  Centrar foto
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="mt-3 rounded-2xl bg-surface p-4 text-center text-base text-ink-soft">
            {slug ? "Cargando tu modelo…" : "Elige tu iPhone para ver la carcasa."}
          </p>
        )}
      </section>

      <section aria-labelledby="paso-enviar" className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 id="paso-enviar" className={paso}>
          4. Envíanos tu diseño
        </h2>
        <p className="mt-1 text-base text-ink-soft">
          Comparte la vista previa por WhatsApp con Casemood. Después mándanos la foto original en el mismo chat para
          imprimirla en buena calidad.
        </p>
        <div className="mt-4 space-y-3">
          <button
            type="button"
            disabled={!foto || !contorno || compartiendo}
            onClick={compartir}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-whatsapp px-4 text-lg font-bold text-white shadow-md active:brightness-95 disabled:opacity-50"
          >
            <IconWhatsApp className="h-6 w-6" />
            {compartiendo ? "Preparando…" : "Compartir mi diseño"}
          </button>
          <a
            href={whatsappUrl(whatsapp, mensaje)}
            target="_blank"
            rel="noopener noreferrer"
            className={`${boton} w-full gap-2`}
          >
            <IconWhatsApp className="h-5 w-5 text-whatsapp" />
            Abrir el chat de Casemood
          </a>
        </div>
        {aviso && (
          <p role="status" className="mt-3 rounded-2xl bg-brand-soft p-3 text-base">
            {aviso}
          </p>
        )}
        <p className="mt-3 text-sm text-ink-soft">
          ¿No encuentras a Casemood al compartir? Abre el chat con el segundo botón y adjunta la imagen desde tu galería.
        </p>
      </section>
    </div>
  );
}
