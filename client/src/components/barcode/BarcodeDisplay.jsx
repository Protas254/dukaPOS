import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

export default function BarcodeDisplay({ value, width = 2, height = 50, fontSize = 12, className = '' }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;
    JsBarcode(svgRef.current, value, {
      format: 'CODE128',
      width,
      height,
      fontSize,
      margin: 4,
      displayValue: true,
    });
  }, [value, width, height, fontSize]);

  if (!value) return null;

  return <svg ref={svgRef} className={className} />;
}