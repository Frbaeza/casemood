/** 12990 -> "$12.990" (formato chileno, sin decimales). */
export function formatCLP(valor: number): string {
  const entero = Math.round(valor);
  const signo = entero < 0 ? "-" : "";
  return `${signo}$${Math.abs(entero).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

/** URL pública de una imagen guardada en R2. */
export function imgUrl(key: string): string {
  return `/img/${key}`;
}

/** Link de WhatsApp con mensaje prellenado. */
export function whatsappUrl(numero: string, mensaje: string): string {
  return `https://wa.me/${numero.replace(/\D/g, "")}?text=${encodeURIComponent(mensaje)}`;
}
