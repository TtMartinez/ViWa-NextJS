"use client";

// Botón de envío que pide confirmación antes de mandar el formulario.
export default function BotonConfirmar({ mensaje, className, children }) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(mensaje)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
