"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import { alpha, useTheme } from "@mui/material/styles";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import ShoppingBagRoundedIcon from "@mui/icons-material/ShoppingBagRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import AcUnitRoundedIcon from "@mui/icons-material/AcUnitRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import {
  useGetDashboardQuery,
  type DashboardPeriodPreset,
  type LowStockItem,
  type MetricValue,
  type TopProduct,
} from "@/app/admin/(panel)/store/dashboardAPI";
import type { OrderStatus } from "@/app/admin/(panel)/orders/store/orderAPI";
import { normalizeDashboardOrderStatus } from "@/lib/order/status";
import { selectAuthUser } from "@/app/admin/login/store/authSlice";
import { StaffHome } from "@/components/admin/staff-home";
import { formatPrice } from "@/lib/data";
import { can } from "@/lib/rbac";
import { useAppSelector } from "@/lib/store/hooks";

const PERIOD_OPTIONS: Array<{ value: DashboardPeriodPreset; label: string }> = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "12m", label: "12m" },
];

const PERIOD_LABELS: Record<DashboardPeriodPreset, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "12m": "Last 12 months",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#244eec",
  SHIPPED: "#0ea5e9",
  DELIVERED: "#059669",
  CANCELLED: "#ef4444",
  RETURNED: "#94a3b8",
};

const STATUS_TONES: Record<
  OrderStatus,
  "warning" | "info" | "primary" | "success" | "error" | "inherit"
> = {
  PENDING: "warning",
  CONFIRMED: "info",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELLED: "error",
  RETURNED: "inherit",
};

const ALL_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
];

function formatChangeHint(metric: MetricValue): string {
  if (metric.changePercent === null) return "New vs prior period";
  if (metric.changePercent === 0) return "No change vs prior period";
  const sign = metric.changePercent > 0 ? "+" : "";
  return `${sign}${metric.changePercent.toFixed(1)}% vs prior period`;
}

function formatAxisLabel(date: string, granularity: "day" | "month"): string {
  if (granularity === "month") {
    const [year, month] = date.split("-");
    const parsed = new Date(Number(year), Number(month) - 1, 1);
    return parsed.toLocaleDateString("en-PK", { month: "short", year: "2-digit" });
  }

  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-PK", { month: "short", day: "numeric" });
}

function statusLabel(status: OrderStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function sparkValues(points: Array<{ value: number }>, maxPoints = 14): number[] {
  if (!points.length) return [0];
  const slice = points.slice(-maxPoints);
  return slice.map((point) => point.value);
}

function MiniSpark({ values, light }: { values: number[]; light?: boolean }) {
  const max = Math.max(...values, 1);
  return (
    <Stack
      direction="row"
      spacing={0.4}
      sx={{
        alignItems: "flex-end",
        height: 28,
      }}
    >
      {values.map((v, i) => (
        <Box
          key={i}
          sx={{
            width: 5,
            height: `${Math.max(18, (v / max) * 100)}%`,
            borderRadius: 1,
            bgcolor: light ? "rgba(255,255,255,0.55)" : "primary.main",
            opacity: 0.35 + (i / values.length) * 0.65,
          }}
        />
      ))}
    </Stack>
  );
}

function ChangeBadge({ metric }: { metric: MetricValue }) {
  if (metric.changePercent === null) {
    return (
      <Chip
        size="small"
        label="New"
        sx={{
          height: 22,
          bgcolor: alpha("#fff", 0.18),
          color: "common.white",
          fontWeight: 700,
        }}
      />
    );
  }

  const up = metric.changePercent > 0;
  const flat = metric.changePercent === 0;

  return (
    <Chip
      size="small"
      icon={
        flat ? undefined : up ? (
          <TrendingUpRoundedIcon sx={{ fontSize: "14px !important" }} />
        ) : (
          <TrendingDownRoundedIcon sx={{ fontSize: "14px !important" }} />
        )
      }
      label={
        flat
          ? "0%"
          : `${up ? "+" : ""}${metric.changePercent.toFixed(1)}%`
      }
      sx={{
        height: 22,
        bgcolor: alpha("#fff", 0.18),
        color: "common.white",
        fontWeight: 700,
        "& .MuiChip-icon": { color: "common.white" },
      }}
    />
  );
}

export function AdminDashboardView() {
  const theme = useTheme();
  const user = useAppSelector(selectAuthUser);
  const canViewReports = can(user, "REPORTS");
  const [period, setPeriod] = useState<DashboardPeriodPreset>("30d");
  const { data, isLoading, isFetching, isError, refetch } = useGetDashboardQuery(
    {
      period,
      limit: 10,
    },
    { skip: !canViewReports },
  );

  const overview = data?.data;
  const summary = overview?.summary;
  const charts = overview?.charts;
  const topProducts: TopProduct[] = overview?.topProducts ?? [];
  const lowStock: LowStockItem[] = overview?.lowStock ?? [];
  const granularity = overview?.period.granularity ?? "day";

  const today = new Date().toLocaleDateString("en-PK", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const salesDataset = useMemo(() => {
    if (!charts?.revenue?.length) return [];
    return charts.revenue.map((point, index) => ({
      label: formatAxisLabel(point.date, granularity),
      sales: point.value,
      orders: charts.orders[index]?.value ?? 0,
    }));
  }, [charts, granularity]);

  const statusMix = useMemo(() => {
    const counts = new Map<OrderStatus, number>();
    for (const status of ALL_STATUSES) counts.set(status, 0);
    for (const row of charts?.ordersByStatus ?? []) {
      const status = normalizeDashboardOrderStatus(String(row.status));
      if (!status) continue;
      counts.set(status, (counts.get(status) ?? 0) + row.count);
    }

    return ALL_STATUSES.map((status, id) => ({
      id,
      status,
      label: statusLabel(status),
      value: counts.get(status) ?? 0,
      color: STATUS_COLORS[status],
      tone: STATUS_TONES[status],
    })).filter((item) => item.value > 0);
  }, [charts?.ordersByStatus]);

  if (!canViewReports) {
    return <StaffHome />;
  }

  const statusTotal = statusMix.reduce((sum, item) => sum + item.value, 0);
  const pendingCount =
    charts?.ordersByStatus.find((row) => row.status === "PENDING")?.count ?? 0;
  const maxSold = Math.max(...topProducts.map((p) => p.unitsSold), 1);

  const kpiCards = summary
    ? [
        {
          label: "Revenue",
          value: formatPrice(summary.revenue.value),
          hint: formatChangeHint(summary.revenue),
          metric: summary.revenue,
          icon: <TrendingUpRoundedIcon />,
          gradient:
            "linear-gradient(135deg, #0e1650 0%, #1d2f8b 55%, #244eec 100%)",
          spark: sparkValues(charts?.revenue ?? []),
        },
        {
          label: "Orders",
          value: String(Math.round(summary.orders.value)),
          hint: formatChangeHint(summary.orders),
          metric: summary.orders,
          icon: <ShoppingBagRoundedIcon />,
          gradient:
            "linear-gradient(135deg, #b45309 0%, #f59e0b 55%, #fbbf24 100%)",
          spark: sparkValues(charts?.orders ?? []),
        },
        {
          label: "New customers",
          value: String(Math.round(summary.customers.value)),
          hint: formatChangeHint(summary.customers),
          metric: summary.customers,
          icon: <GroupsRoundedIcon />,
          gradient:
            "linear-gradient(135deg, #065f46 0%, #059669 55%, #34d399 100%)",
          spark: sparkValues(charts?.customers ?? []),
        },
        {
          label: "Low stock",
          value: String(summary.lowStockCount),
          hint:
            summary.outOfStockCount > 0
              ? `${summary.outOfStockCount} out of stock`
              : "Inventory at/below threshold",
          metric: null,
          icon: <Inventory2RoundedIcon />,
          gradient:
            "linear-gradient(135deg, #4c1d95 0%, #7c3aed 55%, #a78bfa 100%)",
          spark: [summary.outOfStockCount, summary.lowStockCount],
        },
      ]
    : [];

  return (
    <Box sx={{ pb: 2 }}>
      {(isLoading || isFetching) && (
        <LinearProgress
          sx={{
            mb: 2,
            borderRadius: 999,
            height: 3,
          }}
        />
      )}

      {/* Hero welcome */}
      <Card
        sx={{
          mb: 3,
          overflow: "hidden",
          border: "none",
          background:
            "radial-gradient(1200px 400px at 10% -20%, rgba(245,158,11,0.28), transparent 55%), linear-gradient(135deg, #0e1650 0%, #1d2f8b 48%, #244eec 100%)",
          color: "common.white",
          boxShadow: "0 20px 48px rgba(14, 22, 80, 0.28)",
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2.5}
            sx={{
              alignItems: { md: "center" },
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: "center",
                  mb: 1,
                  flexWrap: "wrap",
                }}
              >
                <Chip
                  size="small"
                  icon={
                    <AcUnitRoundedIcon sx={{ fontSize: "16px !important" }} />
                  }
                  label={PERIOD_LABELS[period]}
                  sx={{
                    bgcolor: alpha("#fbbf24", 0.2),
                    color: "#fde68a",
                    border: "1px solid rgba(251,191,36,0.35)",
                    "& .MuiChip-icon": { color: "#fbbf24" },
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{ color: alpha("#fff", 0.7) }}
                >
                  {today}
                </Typography>
              </Stack>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  mb: 0.75,
                  fontSize: { xs: "1.6rem", md: "2rem" },
                }}
              >
                Command center for National Electronics
              </Typography>
              <Typography sx={{ color: alpha("#fff", 0.78), maxWidth: 560 }}>
                {summary
                  ? `${formatPrice(summary.revenue.value)} revenue · ${Math.round(summary.orders.value)} orders · AOV ${formatPrice(summary.averageOrderValue.value)}. ${pendingCount} pending order${pendingCount === 1 ? "" : "s"} in the queue.`
                  : "Loading store performance for the selected period."}
              </Typography>
            </Box>

            <Stack
              spacing={1.5}
              sx={{
                alignItems: { xs: "stretch", md: "flex-end" },
              }}
            >
              <ToggleButtonGroup
                exclusive
                size="small"
                value={period}
                onChange={(_, next: DashboardPeriodPreset | null) => {
                  if (next) setPeriod(next);
                }}
                sx={{
                  bgcolor: alpha("#fff", 0.08),
                  borderRadius: 2,
                  "& .MuiToggleButton-root": {
                    color: alpha("#fff", 0.75),
                    border: "none",
                    px: 1.5,
                    "&.Mui-selected": {
                      bgcolor: alpha("#fbbf24", 0.25),
                      color: "#fde68a",
                      "&:hover": { bgcolor: alpha("#fbbf24", 0.32) },
                    },
                  },
                }}
              >
                {PERIOD_OPTIONS.map((option) => (
                  <ToggleButton key={option.value} value={option.value}>
                    {option.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>

              <Stack
                direction="row"
                spacing={1.25}
                useFlexGap
                sx={{ flexWrap: "wrap" }}
              >
                <Button
                  component={Link}
                  href="/admin/products"
                  variant="contained"
                  color="secondary"
                  startIcon={<AddRoundedIcon />}
                >
                  Add product
                </Button>
                <Button
                  component={Link}
                  href="/admin/orders"
                  variant="outlined"
                  endIcon={<ArrowOutwardRoundedIcon />}
                  sx={{
                    borderColor: alpha("#fff", 0.35),
                    color: "common.white",
                    "&:hover": {
                      borderColor: "#fbbf24",
                      bgcolor: alpha("#fff", 0.08),
                    },
                  }}
                >
                  Fulfill orders
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {isError && !overview && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          Could not load dashboard analytics. Check your REPORTS permission and
          try again.
        </Alert>
      )}

      {isLoading && !overview && (
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
            minHeight: 280,
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {overview && summary && (
        <>
          {/* KPI row */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            {kpiCards.map((kpi) => (
              <Grid key={kpi.label} size={{ xs: 12, sm: 6, xl: 3 }}>
                <Card
                  sx={{
                    height: "100%",
                    background: kpi.gradient,
                    color: "common.white",
                    border: "none",
                    transition: "transform 220ms ease, box-shadow 220ms ease",
                    "&:hover": {
                      transform: "translateY(-3px)",
                      boxShadow: "0 18px 40px rgba(14,22,80,0.22)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack
                      direction="row"
                      sx={{
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: 2.5,
                          display: "grid",
                          placeItems: "center",
                          bgcolor: alpha("#fff", 0.16),
                        }}
                      >
                        {kpi.icon}
                      </Box>
                      <Stack spacing={0.75} sx={{ alignItems: "flex-end" }}>
                        {kpi.metric ? <ChangeBadge metric={kpi.metric} /> : null}
                        <MiniSpark values={kpi.spark} light />
                      </Stack>
                    </Stack>
                    <Typography
                      variant="overline"
                      sx={{ color: alpha("#fff", 0.75), lineHeight: 1 }}
                    >
                      {kpi.label}
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 800,
                        letterSpacing: "-0.03em",
                        mt: 0.5,
                        mb: 0.75,
                        fontSize: { xs: "1.55rem", md: "1.75rem" },
                      }}
                    >
                      {kpi.value}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: alpha("#fff", 0.8) }}
                    >
                      {kpi.hint}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2.5}>
            {/* Sales chart */}
            <Grid size={{ xs: 12, lg: 8 }}>
              <Card sx={{ height: "100%" }}>
                <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    sx={{
                      justifyContent: "space-between",
                      alignItems: { sm: "center" },
                      mb: 1,
                    }}
                  >
                    <Box>
                      <Typography variant="h6">Sales pulse</Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                      >
                        Revenue by {granularity === "month" ? "month" : "day"}{" "}
                        · {PERIOD_LABELS[period].toLowerCase()}
                      </Typography>
                    </Box>
                    <Chip
                      label={PERIOD_LABELS[period]}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  </Stack>
                  <Box sx={{ width: "100%", height: 280 }}>
                    {salesDataset.length > 0 ? (
                      <BarChart
                        dataset={salesDataset}
                        xAxis={[{ dataKey: "label", scaleType: "band" }]}
                        series={[
                          {
                            dataKey: "sales",
                            label: "Sales (Rs)",
                            color: theme.palette.primary.main,
                            valueFormatter: (v) =>
                              formatPrice(Number(v ?? 0)),
                          },
                        ]}
                        margin={{ left: 20, right: 12, top: 20, bottom: 8 }}
                        borderRadius={8}
                        grid={{ horizontal: true }}
                        sx={{
                          "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": {
                            stroke: alpha(theme.palette.text.primary, 0.12),
                          },
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: "100%",
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <Typography color="text.secondary">
                          No revenue in this period
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Order status mix */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <Card sx={{ height: "100%" }}>
                <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                  <Typography variant="h6">Order status mix</Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      mb: 1,
                    }}
                  >
                    All statuses in the selected period
                  </Typography>
                  <Box sx={{ width: "100%", height: 240 }}>
                    {statusMix.length > 0 ? (
                      <PieChart
                        series={[
                          {
                            data: statusMix,
                            innerRadius: 55,
                            outerRadius: 90,
                            paddingAngle: 3,
                            cornerRadius: 6,
                            highlightScope: {
                              fade: "global",
                              highlight: "item",
                            },
                            valueFormatter: (item) => `${item.value}`,
                          },
                        ]}
                        hideLegend
                        margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: "100%",
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <Typography color="text.secondary">
                          No orders in this period
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <Stack spacing={1}>
                    {statusMix.map((item) => (
                      <Stack
                        key={item.status}
                        direction="row"
                        sx={{
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ alignItems: "center" }}
                        >
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              bgcolor: item.color,
                            }}
                          />
                          <Typography variant="body2">{item.label}</Typography>
                        </Stack>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700 }}
                        >
                          {item.value}
                          {statusTotal > 0
                            ? ` · ${Math.round((item.value / statusTotal) * 100)}%`
                            : ""}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Low stock table */}
            <Grid size={{ xs: 12, lg: 8 }}>
              <Card>
                <CardContent
                  sx={{ p: { xs: 2, md: 2.5 }, pb: "12px !important" }}
                >
                  <Stack
                    direction="row"
                    sx={{
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1.5,
                    }}
                  >
                    <Box>
                      <Typography variant="h6">Low stock alerts</Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                      >
                        Live inventory · not filtered by period
                      </Typography>
                    </Box>
                    <Button
                      component={Link}
                      href="/admin/inventory"
                      size="small"
                      endIcon={<ArrowOutwardRoundedIcon />}
                    >
                      Inventory
                    </Button>
                  </Stack>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell>SKU</TableCell>
                          <TableCell align="right">Stock</TableCell>
                          <TableCell align="right">Threshold</TableCell>
                          <TableCell align="right">Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {lowStock.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5}>
                              <Typography
                                variant="body2"
                                sx={{ color: "text.secondary", py: 2 }}
                              >
                                No low-stock items right now.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          lowStock.map((item) => (
                            <TableRow
                              key={item.productId}
                              hover
                              sx={{ "&:last-child td": { border: 0 } }}
                            >
                              <TableCell>
                                <Typography
                                  component={Link}
                                  href={`/admin/products`}
                                  sx={{
                                    fontWeight: 700,
                                    color: "primary.dark",
                                    textDecoration: "none",
                                    "&:hover": { textDecoration: "underline" },
                                  }}
                                >
                                  {item.name}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {item.sku}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 600 }}
                                >
                                  {item.stock}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography
                                  variant="body2"
                                  sx={{ color: "text.secondary" }}
                                >
                                  {item.lowStock}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Chip
                                  size="small"
                                  label={
                                    item.isOutOfStock
                                      ? "Out of stock"
                                      : `Deficit ${item.deficit}`
                                  }
                                  color={
                                    item.isOutOfStock ? "error" : "warning"
                                  }
                                  variant={
                                    item.isOutOfStock ? "filled" : "outlined"
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Pipeline + catalog snapshot */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <Stack spacing={2.5}>
                <Card>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="h6" sx={{ mb: 0.5 }}>
                      Fulfillment pipeline
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                        mb: 2,
                      }}
                    >
                      Order mix for {PERIOD_LABELS[period].toLowerCase()}
                    </Typography>
                    <Stack spacing={1.75}>
                      {(statusMix.length
                        ? statusMix
                        : ALL_STATUSES.slice(0, 4).map((status) => ({
                            status,
                            label: statusLabel(status),
                            value: 0,
                            tone: STATUS_TONES[status],
                          }))
                      ).map((stage) => (
                        <Box key={stage.status}>
                          <Stack
                            direction="row"
                            sx={{
                              justifyContent: "space-between",
                              mb: 0.75,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600 }}
                            >
                              {stage.label}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: "text.secondary" }}
                            >
                              {stage.value}
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={
                              statusTotal > 0
                                ? (stage.value / statusTotal) * 100
                                : 0
                            }
                            color={
                              "tone" in stage && stage.tone !== "inherit"
                                ? stage.tone
                                : "primary"
                            }
                            sx={{
                              height: 8,
                              borderRadius: 999,
                              bgcolor: alpha(
                                theme.palette.text.primary,
                                0.06,
                              ),
                            }}
                          />
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="h6" sx={{ mb: 1.5 }}>
                      Catalog snapshot
                    </Typography>
                    <Stack spacing={1.5} divider={<Divider flexItem />}>
                      {[
                        {
                          label: "Average order value",
                          value: formatPrice(
                            summary.averageOrderValue.value,
                          ),
                          icon: <ReceiptLongRoundedIcon fontSize="small" />,
                        },
                        {
                          label: "Total customers",
                          value: summary.totalCustomers.toLocaleString(),
                          icon: <GroupsRoundedIcon fontSize="small" />,
                        },
                        {
                          label: "Active products",
                          value: summary.totalProducts.toLocaleString(),
                          icon: <Inventory2RoundedIcon fontSize="small" />,
                        },
                        {
                          label: "Out of stock",
                          value: String(summary.outOfStockCount),
                          icon: <LocalShippingRoundedIcon fontSize="small" />,
                        },
                      ].map((item) => (
                        <Stack
                          key={item.label}
                          direction="row"
                          spacing={1.5}
                          sx={{ alignItems: "center" }}
                        >
                          <Avatar
                            sx={{
                              width: 34,
                              height: 34,
                              bgcolor: alpha(
                                theme.palette.primary.main,
                                0.1,
                              ),
                              color: "primary.main",
                            }}
                          >
                            {item.icon}
                          </Avatar>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              variant="caption"
                              sx={{ color: "text.secondary" }}
                            >
                              {item.label}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 700 }}
                            >
                              {item.value}
                            </Typography>
                          </Box>
                        </Stack>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>

            {/* Top products */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Card>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack
                    direction="row"
                    sx={{
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="h6">Top products</Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                      >
                        Best movers · {PERIOD_LABELS[period].toLowerCase()}
                      </Typography>
                    </Box>
                    <Button
                      component={Link}
                      href="/admin/products"
                      size="small"
                      endIcon={<ArrowOutwardRoundedIcon />}
                    >
                      Catalog
                    </Button>
                  </Stack>
                  <Stack spacing={2}>
                    {topProducts.length === 0 ? (
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                      >
                        No product sales in this period.
                      </Typography>
                    ) : (
                      topProducts.map((product, index) => (
                        <Box
                          key={product.productId ?? `${product.sku}-${index}`}
                          {...(product.productId
                            ? {
                                component: Link,
                                href: "/admin/products",
                              }
                            : {})}
                          sx={{
                            textDecoration: "none",
                            color: "inherit",
                            display: "block",
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={2}
                            sx={{
                              justifyContent: "space-between",
                              alignItems: "baseline",
                              mb: 0.75,
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={1.25}
                              sx={{
                                alignItems: "center",
                                minWidth: 0,
                              }}
                            >
                              <Avatar
                                sx={{
                                  width: 28,
                                  height: 28,
                                  fontSize: 12,
                                  fontWeight: 800,
                                  bgcolor:
                                    index === 0
                                      ? "secondary.main"
                                      : alpha(
                                          theme.palette.primary.main,
                                          0.1,
                                        ),
                                  color:
                                    index === 0
                                      ? "secondary.contrastText"
                                      : "primary.dark",
                                }}
                              >
                                {index + 1}
                              </Avatar>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography
                                  variant="body2"
                                  noWrap
                                  sx={{ fontWeight: 700 }}
                                >
                                  {product.productName}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{ color: "text.secondary" }}
                                >
                                  {product.sku}
                                </Typography>
                              </Box>
                            </Stack>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "text.secondary",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {product.unitsSold} sold ·{" "}
                              {formatPrice(product.revenue)}
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={(product.unitsSold / maxSold) * 100}
                            sx={{
                              height: 8,
                              borderRadius: 999,
                              bgcolor: alpha(
                                theme.palette.primary.main,
                                0.08,
                              ),
                              "& .MuiLinearProgress-bar": {
                                borderRadius: 999,
                                background:
                                  index === 0
                                    ? "linear-gradient(90deg, #b45309, #fbbf24)"
                                    : "linear-gradient(90deg, #0e1650, #3a6df7)",
                              },
                            }}
                          />
                        </Box>
                      ))
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Quick actions */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Card
                sx={{
                  height: "100%",
                  background:
                    "linear-gradient(160deg, rgba(29,47,139,0.06) 0%, rgba(245,158,11,0.08) 100%)",
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="h6" sx={{ mb: 0.5 }}>
                    Quick actions
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      mb: 2,
                    }}
                  >
                    Jump into the work that moves the store forward
                  </Typography>
                  <Grid container spacing={1.5}>
                    {[
                      {
                        href: "/admin/products",
                        label: "New product",
                        icon: <AddRoundedIcon />,
                      },
                      {
                        href: "/admin/coupons",
                        label: "Create coupon",
                        icon: <ConfirmationNumberRoundedIcon />,
                      },
                      {
                        href: "/admin/delivery-methods",
                        label: "Delivery methods",
                        icon: <LocalShippingRoundedIcon />,
                      },
                      {
                        href: "/admin/inventory",
                        label: "Restock alerts",
                        icon: <Inventory2RoundedIcon />,
                      },
                    ].map((action) => (
                      <Grid key={action.href} size={{ xs: 6 }}>
                        <Button
                          component={Link}
                          href={action.href}
                          fullWidth
                          variant="contained"
                          color="primary"
                          startIcon={action.icon}
                          sx={{
                            justifyContent: "flex-start",
                            py: 1.5,
                            px: 1.75,
                            bgcolor: "background.paper",
                            color: "text.primary",
                            border: "1px solid",
                            borderColor: "divider",
                            boxShadow: "0 6px 16px rgba(14,22,80,0.05)",
                            "&:hover": {
                              bgcolor: "primary.main",
                              color: "common.white",
                              borderColor: "primary.main",
                            },
                          }}
                        >
                          {action.label}
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
