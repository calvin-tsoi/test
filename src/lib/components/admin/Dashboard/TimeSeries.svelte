<script lang="ts">
	import { getContext } from 'svelte';
	import type { TimeRangeStats } from '$lib/apis/dashboard';
	import { getTimeSeriesStats } from '$lib/apis/dashboard';

	const i18n = getContext('i18n');

	export let timeSeriesStats: TimeRangeStats[];

	let selectedPeriod = '7d';
	let loading = false;

	const formatStorage = (mb: number) => {
		if (mb >= 1024) {
			return `${(mb / 1024).toFixed(2)} GB`;
		}
		return `${mb.toFixed(2)} MB`;
	};

	const loadTimeSeriesData = async (period: string) => {
		loading = true;
		try {
			timeSeriesStats = await getTimeSeriesStats(localStorage.token, period);
		} catch (error) {
			console.error('Failed to load time series data:', error);
		} finally {
			loading = false;
		}
	};

	const handlePeriodChange = (event: Event) => {
		const target = event.target as HTMLSelectElement;
		selectedPeriod = target.value;
		loadTimeSeriesData(selectedPeriod);
	};

	// Load initial data when component mounts
	$: if (timeSeriesStats && timeSeriesStats.length === 0) {
		loadTimeSeriesData(selectedPeriod);
	}
</script>

<div class="space-y-6">
	<!-- Period Selection -->
	<div class="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
		<div class="flex items-center justify-between">
			<h3 class="text-lg font-semibold text-gray-900 dark:text-white">{$i18n.t('Content Generation Over Time')}</h3>
			<div class="flex items-center space-x-4">
				<label for="period-select" class="text-sm font-medium text-gray-700 dark:text-gray-300">
					{$i18n.t('Time Period')}:
				</label>
				<select
					id="period-select"
					bind:value={selectedPeriod}
					on:change={handlePeriodChange}
					class="block w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
				>
					<option value="7d">{$i18n.t('Last 7 Days')}</option>
					<option value="30d">{$i18n.t('Last 30 Days')}</option>
					<option value="90d">{$i18n.t('Last 90 Days')}</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Summary Cards -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
		{#if timeSeriesStats && timeSeriesStats.length > 0}
			{@const totalChats = timeSeriesStats.reduce((sum, stat) => sum + stat.chats_created, 0)}
			{@const totalFiles = timeSeriesStats.reduce((sum, stat) => sum + stat.files_uploaded, 0)}
			{@const totalImages = timeSeriesStats.reduce((sum, stat) => sum + stat.images_generated, 0)}
			{@const totalMessages = timeSeriesStats.reduce((sum, stat) => sum + stat.messages_sent, 0)}
			{@const totalStorage = timeSeriesStats.reduce((sum, stat) => sum + stat.storage_used_mb, 0)}

			<div class="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
				<div class="flex items-center">
					<div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
						<svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
						</svg>
					</div>
					<div class="ml-4">
						<p class="text-sm font-medium text-gray-600 dark:text-gray-400">{$i18n.t('Total Chats')}</p>
						<p class="text-2xl font-semibold text-gray-900 dark:text-white">{totalChats}</p>
					</div>
				</div>
			</div>

			<div class="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
				<div class="flex items-center">
					<div class="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
						<svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
						</svg>
					</div>
					<div class="ml-4">
						<p class="text-sm font-medium text-gray-600 dark:text-gray-400">{$i18n.t('Total Files')}</p>
						<p class="text-2xl font-semibold text-gray-900 dark:text-white">{totalFiles}</p>
					</div>
				</div>
			</div>

			<div class="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
				<div class="flex items-center">
					<div class="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
						<svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
						</svg>
					</div>
					<div class="ml-4">
						<p class="text-sm font-medium text-gray-600 dark:text-gray-400">{$i18n.t('Total Images')}</p>
						<p class="text-2xl font-semibold text-gray-900 dark:text-white">{totalImages}</p>
					</div>
				</div>
			</div>

			<div class="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
				<div class="flex items-center">
					<div class="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
						<svg class="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
						</svg>
					</div>
					<div class="ml-4">
						<p class="text-sm font-medium text-gray-600 dark:text-gray-400">{$i18n.t('Total Messages')}</p>
						<p class="text-2xl font-semibold text-gray-900 dark:text-white">{totalMessages}</p>
					</div>
				</div>
			</div>

			<div class="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
				<div class="flex items-center">
					<div class="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
						<svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
						</svg>
					</div>
					<div class="ml-4">
						<p class="text-sm font-medium text-gray-600 dark:text-gray-400">{$i18n.t('Total Storage')}</p>
						<p class="text-2xl font-semibold text-gray-900 dark:text-white">{formatStorage(totalStorage)}</p>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Time Series Chart Placeholder -->
	<div class="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
		<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">{$i18n.t('Content Generation Trends')}</h3>
		<div class="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
			{#if loading}
				<div class="flex items-center space-x-2">
					<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
					<p class="text-gray-500 dark:text-gray-400">{$i18n.t('Loading...')}</p>
				</div>
			{:else}
				<p class="text-gray-500 dark:text-gray-400">{$i18n.t('Chart visualization would be implemented here')}</p>
			{/if}
		</div>
	</div>

	<!-- Time Series Data Table -->
	<div class="bg-white dark:bg-gray-900 rounded-lg shadow">
		<div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
			<h3 class="text-lg font-semibold text-gray-900 dark:text-white">{$i18n.t('Daily Content Generation')}</h3>
		</div>

		<div class="overflow-x-auto">
			{#if loading}
				<div class="p-6 text-center">
					<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
					<p class="mt-2 text-gray-500 dark:text-gray-400">{$i18n.t('Loading data...')}</p>
				</div>
			{:else if timeSeriesStats && timeSeriesStats.length > 0}
				<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
					<thead class="bg-gray-50 dark:bg-gray-800">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{$i18n.t('Date')}</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{$i18n.t('Chats Created')}</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{$i18n.t('Files Uploaded')}</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{$i18n.t('Images Generated')}</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{$i18n.t('Messages Sent')}</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{$i18n.t('Storage Used')}</th>
						</tr>
					</thead>
					<tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
						{#each timeSeriesStats as stat}
							<tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
								<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{stat.period}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{stat.chats_created}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{stat.files_uploaded}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{stat.images_generated}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{stat.messages_sent}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatStorage(stat.storage_used_mb)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{:else}
				<div class="p-6 text-center">
					<p class="text-gray-500 dark:text-gray-400">{$i18n.t('No data available for the selected period')}</p>
				</div>
			{/if}
		</div>
	</div>
</div>