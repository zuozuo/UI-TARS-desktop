/**
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect } from 'react';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { useSetting } from '@renderer/hooks/useSetting';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@renderer/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@renderer/components/ui/select';
import { Checkbox } from '@renderer/components/ui/checkbox';
import { SearchEngineForSettings } from '@/main/store/types';

import googleIcon from '@resources/icons/google-color.svg?url';
import bingIcon from '@resources/icons/bing-color.svg?url';
import baiduIcon from '@resources/icons/baidu-color.svg?url';

const formSchema = z.object({
  searchEngineForBrowser: z.nativeEnum(SearchEngineForSettings),
  enablePersistentProfile: z.boolean().optional(),
});

export function LocalBrowserSettings() {
  const { settings, updateSetting } = useSetting();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      searchEngineForBrowser: undefined,
      enablePersistentProfile: false,
    },
  });

  const [newSearchEngine, newEnablePersistentProfile] = form.watch([
    'searchEngineForBrowser',
    'enablePersistentProfile',
  ]);

  useEffect(() => {
    if (Object.keys(settings).length) {
      form.reset({
        searchEngineForBrowser: settings.searchEngineForBrowser,
        enablePersistentProfile: settings.enablePersistentProfile ?? false,
      });
    }
  }, [settings, form]);

  useEffect(() => {
    if (!Object.keys(settings).length) {
      return;
    }
    if (newSearchEngine === undefined) {
      return;
    }

    const validAndSave = async () => {
      if (
        newSearchEngine !== settings.searchEngineForBrowser ||
        newEnablePersistentProfile !== settings.enablePersistentProfile
      ) {
        updateSetting({
          ...settings,
          searchEngineForBrowser: newSearchEngine,
          enablePersistentProfile: newEnablePersistentProfile,
        });
      }
    };

    validAndSave();
  }, [
    newSearchEngine,
    newEnablePersistentProfile,
    settings,
    updateSetting,
    form,
  ]);

  return (
    <>
      <Form {...form}>
        <form className="space-y-8">
          <FormField
            control={form.control}
            name="searchEngineForBrowser"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default Search Engine:</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-[124px]">
                      <SelectValue placeholder="Select a search engine" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={SearchEngineForSettings.GOOGLE}>
                      <div className="flex items-center gap-2">
                        <img
                          src={googleIcon}
                          alt="Google"
                          className="w-4 h-4"
                        />
                        <span>Google</span>
                      </div>
                    </SelectItem>
                    <SelectItem value={SearchEngineForSettings.BING}>
                      <div className="flex items-center gap-2">
                        <img src={bingIcon} alt="Bing" className="w-4 h-4" />
                        <span>Bing</span>
                      </div>
                    </SelectItem>
                    <SelectItem value={SearchEngineForSettings.BAIDU}>
                      <div className="flex items-center gap-2">
                        <img src={baiduIcon} alt="Baidu" className="w-4 h-4" />
                        <span>Baidu</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="enablePersistentProfile"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Enable persistent browser profile</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Save browser data (cookies, localStorage, login states)
                    between sessions
                  </p>
                </div>
              </FormItem>
            )}
          />
        </form>
      </Form>
    </>
  );
}
