import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type React from "react";

// --- TYPE DEFINITIONS ---
// Moved here to be shared between files

// Interface for the "connection"
export interface Category {
  id: string;
  name: string;
  description: string;
}

// Product interface updated with imageBase64
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string; // The connection
  imageBase64?: string; // New field for the image
}

// --- HELPER FUNCTIONS ---

/**
 * Formats a number as a USD currency string.
 */
export const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price || 0);
};

/**
 * Exports an array of products to an XLSX file using the xlsx library.
 */
export const exportToXLSX = (
  products: Product[],
  categoryMap: Map<string, string>,
  fileName: string,
) => {
  // Format data for export
  const dataToExport = products.map((prod) => ({
    ID: prod.id,
    Name: prod.name,
    Category: categoryMap.get(prod.categoryId) || "Uncategorized",
    Price: prod.price,
    Description: prod.description,
    // We explicitly omit the large imageBase64 string
  }));

  // Create worksheet and workbook
  const ws = XLSX.utils.json_to_sheet(dataToExport);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Products");

  // Set column widths
  ws["!cols"] = [
    { wch: 30 }, // ID
    { wch: 40 }, // Name
    { wch: 25 }, // Category
    { wch: 15 }, // Price
    { wch: 60 }, // Description
  ];

  // Trigger file download
  XLSX.writeFile(wb, `${fileName}.xlsx`);
  toast.success("Products exported to XLSX");
};

// --- PDF EXPORT COMPONENT ---

const pdfStyles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 30,
    fontFamily: "Helvetica",
  },
  title: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "Helvetica-Bold",
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomColor: "#bfbfbf",
    borderBottomWidth: 1,
    minHeight: 30,
    alignItems: "center",
  },
  tableHeader: {
    backgroundColor: "#f4f4f4",
  },
  tableColHeader: {
    padding: 5,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  tableCol: {
    padding: 5,
  },
  cellText: {
    fontSize: 9,
    textAlign: "left",
  },
  cellTextSmall: {
    fontSize: 8,
    textAlign: "left",
  },
  image: {
    width: 25,
    height: 25,
    objectFit: "cover",
    borderRadius: 3,
  },
  noImage: {
    width: 25,
    height: 25,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 3,
  },
  noImageText: {
    fontSize: 6,
    color: "#a0a0a0",
  },
});

interface ProductPDFProps {
  products: Product[];
  categoryMap: Map<string, string>;
}

export const ProductPDF: React.FC<ProductPDFProps> = ({
  products,
  categoryMap,
}) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      <Text style={pdfStyles.title}> Product Report </Text>
      <View style={pdfStyles.table}>
        {/* Table Header */}
        <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]} fixed>
          <View style={[pdfStyles.tableCol, { width: "10%" }]}>
            <Text style={pdfStyles.tableColHeader}> Image </Text>
          </View>
          <View style={[pdfStyles.tableCol, { width: "25%" }]}>
            <Text style={pdfStyles.tableColHeader}> Name </Text>
          </View>
          <View style={[pdfStyles.tableCol, { width: "20%" }]}>
            <Text style={pdfStyles.tableColHeader}> Category </Text>
          </View>
          <View style={[pdfStyles.tableCol, { width: "15%" }]}>
            <Text style={pdfStyles.tableColHeader}> Price </Text>
          </View>
          <View style={[pdfStyles.tableCol, { width: "30%" }]}>
            <Text style={pdfStyles.tableColHeader}> Description </Text>
          </View>
        </View>

        {/* Table Body */}
        {products.map((prod) => (
          <View key={prod.id} style={pdfStyles.tableRow} wrap={false}>
            {/* Image */}
            <View style={[pdfStyles.tableCol, { width: "10%" }]}>
              {prod.imageBase64 ? (
                <Image style={pdfStyles.image} src={prod.imageBase64} />
              ) : (
                <View style={pdfStyles.noImage}>
                  <Text style={pdfStyles.noImageText}> N / A </Text>
                </View>
              )}
            </View>
            {/* Name */}
            <View style={[pdfStyles.tableCol, { width: "25%" }]}>
              <Text style={pdfStyles.cellText}> {prod.name} </Text>
            </View>
            {/* Category */}
            <View style={[pdfStyles.tableCol, { width: "20%" }]}>
              <Text style={pdfStyles.cellText}>
                {categoryMap.get(prod.categoryId) || "Uncategorized"}
              </Text>
            </View>
            {/* Price */}
            <View style={[pdfStyles.tableCol, { width: "15%" }]}>
              <Text style={pdfStyles.cellText}>
                {" "}
                {formatPrice(prod.price)}{" "}
              </Text>
            </View>
            {/* Description */}
            <View style={[pdfStyles.tableCol, { width: "30%" }]}>
              <Text style={pdfStyles.cellTextSmall}> {prod.description} </Text>
            </View>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);
