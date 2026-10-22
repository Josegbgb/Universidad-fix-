import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Typography,
} from "@mui/material";

const ANIOS = [1, 2, 3, 4, 5];

export default function TemplateGrados() {
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  return (
    <section>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
        Plantilla de grados y asignaturas
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
          gap: 2.5,
        }}
      >
        {ANIOS.map((anio, index) => (
          <Link key={anio} to={`${anio}`} style={{ textDecoration: "none" }}>
            <Card
              sx={{
                height: "100%",
                borderRadius: 2.5,
                border: "1px solid",
                borderColor:
                  selectedCard === index ? "primary.main" : "divider",
                transition: "all 0.25s ease",

                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 4,
                  borderColor: "primary.main",
                },
              }}
            >
              <CardActionArea
                onClick={() => setSelectedCard(index)}
                sx={{ height: "100%" }}
              >
                <CardContent
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1.2,
                    py: 3,
                  }}
                >
                  {/* NÚMERO GRANDE */}
                  <Typography
                    variant="h2"
                    fontWeight="bold"
                    color="primary"
                    lineHeight={1}
                  >
                    {anio}
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{ opacity: 0.6, letterSpacing: 1 }}
                  >
                    AÑO
                  </Typography>

                  {/* SECCIÓN VISUAL (tipo botón como en grados) */}
                  <Box
                    sx={{
                      mt: 1,
                      width: "100%",
                      bgcolor: "primary.main",
                      color: "white",
                      borderRadius: 2,
                      py: 0.8,
                      textAlign: "center",
                      fontWeight: "bold",
                      fontSize: "14px",
                      boxShadow: 2,
                    }}
                  >
                    Ver asignaturas
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Link>
        ))}
      </Box>
    </section>
  );
}
