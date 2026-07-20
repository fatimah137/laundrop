<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'range' => 'nullable|in:daily,weekly,monthly',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors(), 422);
        }

        $range = $this->normalizeRange((string) $request->query('range', 'weekly'));
        [$startDate, $endDate, $resolvedRange, $validationError] = $this->resolveDateRange($request, $range);

        if ($validationError !== null) {
            return $this->error($validationError, 422);
        }

        $report = $this->buildReport($resolvedRange, $startDate, $endDate);

        return $this->success($report);
    }

    public function export(Request $request): StreamedResponse
    {
        $validator = Validator::make($request->all(), [
            'range' => 'nullable|in:daily,weekly,monthly',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            abort(422, 'Parameter report tidak valid.');
        }

        $range = $this->normalizeRange((string) $request->query('range', 'weekly'));
        [$startDate, $endDate, $resolvedRange, $validationError] = $this->resolveDateRange($request, $range);

        if ($validationError !== null) {
            abort(422, $validationError);
        }

        $report = $this->buildReport($resolvedRange, $startDate, $endDate);

        $filenameSuffix = $resolvedRange === 'custom'
            ? ($report['start_date'] . '-to-' . $report['end_date'])
            : $resolvedRange;
        $filename = 'reports-' . $filenameSuffix . '-' . now()->format('Ymd-His') . '.csv';

        return response()->streamDownload(function () use ($report): void {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['Ringkasan']);
            fputcsv($handle, ['Revenue', $report['summary']['revenue']]);
            fputcsv($handle, ['Orders', $report['summary']['orders']]);
            fputcsv($handle, ['Rata-rata', $report['summary']['avg_order']]);
            fputcsv($handle, ['Top Service', $report['summary']['top_service']]);
            fputcsv($handle, []);
            fputcsv($handle, ['Tanggal', 'Revenue', 'Orders']);

            foreach ($report['series'] as $row) {
                fputcsv($handle, [
                    $row['date'],
                    $row['revenue'],
                    $row['orders'],
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    private function normalizeRange(string $range): string
    {
        return in_array($range, ['daily', 'weekly', 'monthly'], true) ? $range : 'weekly';
    }

    private function resolveDateRange(Request $request, string $range): array
    {
        $startDateRaw = (string) $request->query('start_date', '');
        $endDateRaw = (string) $request->query('end_date', '');
        $hasStart = trim($startDateRaw) !== '';
        $hasEnd = trim($endDateRaw) !== '';

        if ($hasStart xor $hasEnd) {
            return [null, null, $range, 'start_date dan end_date harus diisi berpasangan'];
        }

        if ($hasStart && $hasEnd) {
            $startDate = Carbon::parse($startDateRaw)->startOfDay();
            $endDate = Carbon::parse($endDateRaw)->startOfDay();

            if ($endDate->lt($startDate)) {
                return [null, null, $range, 'end_date tidak boleh lebih kecil dari start_date'];
            }

            if ($startDate->diffInDays($endDate) > 366) {
                return [null, null, $range, 'Rentang tanggal maksimal 366 hari'];
            }

            return [$startDate, $endDate, 'custom', null];
        }

        return [null, null, $range, null];
    }

    private function buildReport(string $range, ?Carbon $customStartDate = null, ?Carbon $customEndDate = null): array
    {
        if ($customStartDate !== null && $customEndDate !== null) {
            $startDate = $customStartDate->copy();
            $endDate = $customEndDate->copy();
            $days = $startDate->diffInDays($endDate) + 1;
            $range = 'custom';
        } else {
            $days = $range === 'daily' ? 1 : ($range === 'monthly' ? 30 : 7);
            $endDate = Carbon::today();
            $startDate = Carbon::today()->subDays($days - 1);
        }

        $rows = DB::table('orders')
            ->leftJoin('transactions', 'transactions.order_id', '=', 'orders.id')
            ->leftJoin('payments', function ($join) {
                $join->on('payments.transaction_id', '=', 'transactions.id')
                    ->where('payments.status', '=', Payment::STATUS_PAID);
            })
            ->whereDate('orders.pickup_date', '>=', $startDate->toDateString())
            ->whereDate('orders.pickup_date', '<=', $endDate->toDateString())
            ->groupBy(DB::raw('DATE(orders.pickup_date)'))
            ->selectRaw('DATE(orders.pickup_date) as date')
            ->selectRaw('COUNT(orders.id) as orders')
            ->selectRaw('COALESCE(SUM(CASE WHEN payments.id IS NOT NULL THEN transactions.total_amount ELSE 0 END), 0) as revenue')
            ->get()
            ->keyBy('date');

        $series = [];
        for ($i = 0; $i < $days; $i++) {
            $date = $startDate->copy()->addDays($i)->toDateString();
            $row = $rows->get($date);

            $series[] = [
                'date' => $date,
                'orders' => (int) ($row->orders ?? 0),
                'revenue' => (float) ($row->revenue ?? 0),
            ];
        }

        $totalOrders = array_sum(array_column($series, 'orders'));
        $totalRevenue = array_sum(array_column($series, 'revenue'));
        $avgOrder = $totalOrders > 0 ? round($totalRevenue / $totalOrders, 2) : 0;

        $topService = DB::table('orders')
            ->join('services', 'services.id', '=', 'orders.service_id')
            ->whereDate('orders.pickup_date', '>=', $startDate->toDateString())
            ->whereDate('orders.pickup_date', '<=', $endDate->toDateString())
            ->groupBy('services.name')
            ->selectRaw('services.name, COUNT(*) as total')
            ->orderByDesc('total')
            ->value('services.name') ?? '-';

        return [
            'range' => $range,
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'summary' => [
                'revenue' => (float) $totalRevenue,
                'orders' => (int) $totalOrders,
                'avg_order' => (float) $avgOrder,
                'top_service' => $topService,
            ],
            'series' => $series,
        ];
    }
}
