"use client";

import { useCart } from "@/context/CartContext";

export default function Toast() {
  const { toastMsg } = useCart();

  return (
    <div id="toast" className={toastMsg ? "" : "hidden"}>
      {toastMsg}
    </div>
  );
}
