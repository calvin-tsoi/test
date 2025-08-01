<script lang="ts">
	import { getContext } from 'svelte';
	import type { ContentTypeStats } from '$lib/apis/dashboard';

	const i18n = getContext('i18n');

	export let contentTypeStats: ContentTypeStats[];

	const formatStorage = (mb: number) => {
		if (mb >= 1024) {
			return `${(mb / 1024).toFixed(2)} GB`;
		}
		return `${mb.toFixed(2)} MB`;
	};

	const getColorForType = (type: string) => {
		switch (type) {
			case 'chats':
				return 'bg-blue-500';
			case 'files':
				return 'bg-green-500';
			case 'images':
				return 'bg-purple-500';
			case 'knowledge':
				return 'bg-orange-500';
			case 'messages':
				return 'bg-red-500';
			default:
				return 'bg-gray-500';
		}
	};
</script>

<div class="space-y-6">
	<!-- Content Type Cards -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each contentTypeStats as content}
			<div class="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
				<div class="flex items-center justify-between">
					<div class="flex items-center">
						<div class="p-2 rounded-lg {getColorForType(content.content_type)} bg-opacity-10">
							<div class="w-6 h-6 {getColorForType(content.content_type)} rounded-full"></div>
						</div>
						<div class="ml-4">
							<p class="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">{content.content_type}</p>
							<p class="text-2xl font-semibold text-gray-900 dark:text-white">{content.count.toLocaleString()}</p>
						</div>
					</div>
					<div class="text-right">
						<div class="text-sm font-semibold text-gray-900 dark:text-white">{formatStorage(content.total_size_mb)}</div>
						<div class="text-xs text-gray-500">{content.percentage.toFixed(1)}%</div>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Detailed Content Type Table -->
	<div class="bg-white dark:bg-gray-900 rounded-lg shadow">
		<div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
			<h3 class="text-lg font-semibold text-gray-900 dark:text-white">{$i18n.t('Content Type Details')}</h3>
		</div>

		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
				<thead class="bg-gray-50 dark:bg-gray-800">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{$i18n.t('Content Type')}</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{$i18n.t('Count')}</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{$i18n.t('Percentage')}</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{$i18n.t('Storage Size')}</th>
					</tr>
				</thead>
				<tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
					{#each contentTypeStats as content}
						<tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="flex items-center">
									<div class="w-3 h-3 rounded-full {getColorForType(content.content_type)} mr-3"></div>
									<div class="text-sm font-medium text-gray-900 dark:text-white capitalize">{content.content_type}</div>
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{content.count.toLocaleString()}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{content.percentage.toFixed(1)}%</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatStorage(content.total_size_mb)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>