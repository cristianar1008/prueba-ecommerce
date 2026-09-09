/**
 * Forma EXACTA en la que el backend serializa ProductResponse (record de
 * Java). Este archivo es el "contrato" — si el backend cambia un nombre de
 * campo, este es el único lugar del frontend que se entera primero.
 */
export interface ProductResponseDto {
  id: number;
  name: string;
  unitPrice: number;
  stock: number;
  categoryName: string;
  imageUrl: string | null;
}
