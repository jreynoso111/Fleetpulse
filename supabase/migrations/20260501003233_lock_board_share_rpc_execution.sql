revoke execute on function public.pulse_accept_board_share(text) from public, anon;
revoke execute on function public.pulse_reject_board_share(text) from public, anon;
grant execute on function public.pulse_accept_board_share(text) to authenticated;
grant execute on function public.pulse_reject_board_share(text) to authenticated;
